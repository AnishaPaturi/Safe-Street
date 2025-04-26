const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
require('dotenv').config();
const nodemailer = require('nodemailer');
const bcrypt = require('bcrypt');


const authRoutes = require('./routes/auth');
const uploadRoutes = require('./routes/upload');
const analyzeRoutes = require('./routes/analyze');

const app = express();
app.use(cors());
app.use(express.json());

// In-memory store for OTPs
let otpStore = {};
exports.sendOTP = async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required.' });
  const user = await User.findOne({ email });
  if (!user) return res.status(404).json({ error: 'User not found.' });

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  otpStore[email] = {
    otp,
    expiresAt: Date.now() + 10 * 60 * 1000, // 10 mins
  };

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'safestreet3@gmail.com',
      pass: 'bavqstwykhhcnzyw', 
    },
  });

  const mailOptions = {
    from: 'SafeStreet <safestreet3@gmail.com>',
    to: email,
    subject: 'Your OTP for SafeStreet Password Reset',
    text: `Your OTP is ${otp}. It will expire in 10 minutes.`,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error('Error sending OTP:', error);
      return res.status(500).json({ error: 'Failed to send OTP.' });
    } else {
      console.log('Email sent: ' + info.response);
      res.json({ message: 'OTP sent successfully.' });
    }
  });
};
//Verify OTP only (no password update here)
exports.verifyOTP = async (req, res) => {
  const { email, otp } = req.body;
  const record = otpStore[email];

  if (!record) return res.status(400).json({ error: 'No OTP sent for this email.' });

  if (record.otp !== otp || Date.now() > record.expiresAt) {
    return res.status(400).json({ error: 'Invalid or expired OTP.' });
  }
  res.json({ message: 'OTP verified successfully.' });
};

//Reset Password (after OTP is verified)
exports.resetPassword = async (req, res) => {
  const { email, newPassword } = req.body;
  const record = otpStore[email];

  if (!record) return res.status(400).json({ error: 'OTP not verified or expired.' });

  const user = await User.findOne({ email });
  if (!user) return res.status(404).json({ error: 'User not found.' });

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  user.password = hashedPassword;
  await user.save();
// Remove OTP after password reset
delete otpStore[email];

res.json({ message: 'Password reset successful.' });
};

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log('MongoDB error:', err));


app.use('/api/auth', authRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/analyze', analyzeRoutes);


const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname),
});
const upload = multer({ storage });

app.post('/analyze', upload.single('image'), async (req, res) => {
    console.log("📸 Uploaded file:", req.file);
  
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }
  
    try {
      const form = new FormData();

      form.append('image', fs.createReadStream(req.file.path));
  
      console.log("📤 Sending to Flask...");
      const flaskURL = 'https://aa1f-34-106-205-175.ngrok-free.app/analyze';
      console.log("📡 Sending POST request to:", flaskURL);
      
      const response = await axios.post(flaskURL, form, {
        headers: {
          ...form.getHeaders(),
          'Content-Type': 'multipart/form-data'
        },
      });
      console.log('✅ Flask Response:', response.data);
  
      fs.unlink(req.file.path, (err) => {
        if (err) console.error('Error deleting file:', err);
      });
      
      res.json(response.data);
    } catch (err) {
      console.error('🔥 Analyze error:', err);
      
      // Clean up file even if error occurs
      if (req.file?.path) {
        fs.unlink(req.file.path, (err) => {
          if (err) console.error('Error deleting file:', err);
        });
      }
      
      res.status(500).json({ 
        error: 'Failed to analyze image',
        details: err.message 
      });
    }
});
  


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
