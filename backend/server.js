const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const nodemailer = require('nodemailer');
const bcrypt = require('bcrypt');
require('dotenv').config();

// Import Models
const User = require('./models/User');
const Summary = require('./models/Summary');
const Upload = require('./models/Upload');

// Import Routes
const authRoutes = require('./routes/auth');
const uploadRoutes = require('./routes/upload');
const analyzeRoutes = require('./routes/analyze');

const app = express();
app.use(cors());
app.use(express.json());

// In-memory store for OTPs
let otpStore = {};

// --- OTP and Password Reset APIs ---
app.post('/api/send-otp', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required.' });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: 'User not found.' });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    otpStore[email] = { otp, expiresAt: Date.now() + 10 * 60 * 1000 };

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: 'SafeStreet <safestreet3@gmail.com>',
      to: email,
      subject: 'Your OTP for SafeStreet Password Reset',
      text: `Your OTP is ${otp}. It will expire in 10 minutes.`,
    });

    res.json({ message: 'OTP sent successfully.' });
  } catch (error) {
    console.error('Error sending OTP:', error);
    res.status(500).json({ error: 'Failed to send OTP.' });
  }
});

// Verify OTP
app.post('/api/verify-otp', (req, res) => {
  const { email, otp } = req.body;
  const record = otpStore[email];

  if (!record) return res.status(400).json({ error: 'No OTP sent for this email.' });
  if (record.otp !== otp || Date.now() > record.expiresAt) {
    return res.status(400).json({ error: 'Invalid or expired OTP.' });
  }

  res.json({ message: 'OTP verified successfully.' });
});

// Reset Password
app.post('/api/reset-password', async (req, res) => {
  try {
    const { email, newPassword } = req.body;
    const record = otpStore[email];

    if (!record) return res.status(400).json({ error: 'OTP not verified or expired.' });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: 'User not found.' });

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    delete otpStore[email];
    res.json({ message: 'Password reset successful.' });
  } catch (error) {
    console.error('Error resetting password:', error);
    res.status(500).json({ error: 'Server error during password reset.' });
  }
});

// --- MongoDB Connection ---
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// --- Multer Setup for Uploads ---
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname),
});
const upload = multer({ storage });

// --- Analyze Route ---
app.post('/analyze', upload.single('image'), async (req, res) => {
  console.log("📸 Uploaded file:", req.file);

  if (!req.file) return res.status(400).json({ error: "No file uploaded" });

  try {
    const form = new FormData();
    form.append('image', fs.createReadStream(req.file.path));

    console.log("📤 Sending to Flask...");
    const flaskURL = 'https://03e4-104-196-228-136.ngrok-free.app/analyze';
    console.log("📡 Sending POST request to:", flaskURL);

    const response = await axios.post(flaskURL, form, {
      headers: {
        ...form.getHeaders(),
        'Content-Type': 'multipart/form-data'
      },
    });

    console.log('✅ Flask Response:', response.data);

    const newSummary = new Summary({
      imageUrl: `/uploads/${req.file.filename}`,
      imageType: req.file.mimetype,
      summary: response.data.summary || 'No summary available',
      address: req.body.location || response.data.address || 'Address not provided',
    });
    
    await newSummary.save();
    console.log('✅ Summary saved to MongoDB');

    fs.unlink(req.file.path, (err) => {
      if (err) console.error('Error deleting file:', err);
    });

    res.json({
      message: 'Analysis and saving successful!',
      data: {
        summary: newSummary.summary,
        address: newSummary.address,
        imageUrl: newSummary.imageUrl,
        _id: newSummary._id,
        createdAt: newSummary.createdAt,
      }
    });

  } catch (err) {
    console.error('🔥 Analyze error:', err);

    if (req.file?.path) {
      fs.unlink(req.file.path, (err) => {
        if (err) console.error('Error deleting file:', err);
      });
    }

    res.status(500).json({
      error: 'Failed to analyze and save image',
      details: err.message,
    });
  }
});

// --- Upload New Route for Mobile App ---
app.post('/api/upload/new', upload.single('image'), async (req, res) => {
  try {
    const { userId, location, summary } = req.body;
    console.log('📥 New Upload Request:', req.body);

    if (!userId || !location || !summary) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // ✅ Fetch latitude and longitude using OpenStreetMap (Nominatim)
    let latitude = null;
    let longitude = null;

    try {
      const geocodeRes = await axios.get('https://nominatim.openstreetmap.org/search', {
        params: {
          q: location,
          format: 'json',
          limit: 1,
        },
        headers: {
          'User-Agent': 'SafeStreetApp/1.0 (youremail@example.com)', // required by OpenStreetMap
        }
      });

      if (geocodeRes.data.length > 0) {
        latitude = parseFloat(geocodeRes.data[0].lat);
        longitude = parseFloat(geocodeRes.data[0].lon);
        console.log('📍 Geocoded Location:', latitude, longitude);
      }
    } catch (geoErr) {
      console.error('Failed to geocode location:', geoErr.message);
    }

    // ✅ Save everything to database
    const newUpload = new Upload({
      userId,
      imageUrl: req.file ? `/uploads/${req.file.filename}` : '',
      location,
      summary,
      latitude,   // save fetched latitude
      longitude,  // save fetched longitude
      status: 'Pending', // default status
    });

    await newUpload.save();

    const responseData = {
      message: 'Upload saved successfully!',
      data: {
        summary: newUpload.summary,
        address: newUpload.location,
        latitude: newUpload.latitude,
        longitude: newUpload.longitude,
        imageUrl: newUpload.imageUrl,
        _id: newUpload._id,
        createdAt: newUpload.createdAt,
      },
    };

    console.log('📤 Server Response:', responseData);
    res.json(responseData);

  } catch (err) {
    console.error('Upload save error:', err);
    res.status(500).json({ error: 'Failed to save upload' });
  }
});

// --- ✅ Fetch all previous uploads ---
app.get('/api/upload/all', async (req, res) => {
  try {
    const uploads = await Upload.find().sort({ createdAt: -1 });
    res.json(uploads);
  } catch (error) {
    console.error('Error fetching uploads:', error);
    res.status(500).json({ error: 'Failed to fetch uploads' });
  }
});

// ✅ Mark Report as Resolved
app.put('/api/upload/resolve/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const upload = await Upload.findById(id);

    if (!upload) {
      return res.status(404).json({ error: 'Report not found' });
    }

    upload.status = 'Resolved';
    await upload.save();

    res.json({ message: 'Report marked as resolved ✅' });
  } catch (error) {
    console.error('Error resolving report:', error);
    res.status(500).json({ error: 'Failed to resolve report' });
  }
});




// --- Main Routes ---
app.use('/api/auth', authRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/analyze', analyzeRoutes);

// --- Start Server ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
