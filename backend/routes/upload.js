const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Upload = require('../models/Upload');

// ✅ Ensure the uploads directory exists
const uploadsDir = path.resolve(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true }); // Ensure the uploads directory exists
}

// ✅ Configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir); // Store files in the uploads directory
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // Generate a unique filename based on timestamp
  },
});

const upload = multer({ storage });

// ✅ Route to handle new uploads with image
router.post('/new', upload.single('image'), async (req, res) => {
  // Log the incoming data to check the request
  console.log('Received upload request:', req.body);  // Logs the request body
  console.log('Received file:', req.file);  // Logs the uploaded file information
  
  // Ensure the fields exist and are valid
  const { userId, location, summary } = req.body;
  
  if (!userId || !location || !summary || !req.file) {
    return res.status(400).json({ error: 'Missing required fields (userId, location, summary, or image)' });
  }

  const imageUrl = req.file ? req.file.path : ''; // Ensure we correctly get the file path

  try {
    const newUpload = new Upload({ userId, imageUrl, location, summary });
    await newUpload.save();
    res.status(201).json({ message: 'Upload saved successfully' });
  } catch (err) {
    console.error('Upload failed:', err);  // Log any error that occurs during saving
    res.status(500).json({ error: 'Failed to save upload', details: err.message });
  }
});

// ✅ Route to fetch all uploads for Supervisor
router.get('/all', async (req, res) => {
  try {
    const uploads = await Upload.find().sort({ createdAt: -1 });
    res.json(uploads);
  } catch (err) {
    res.status(500).json({ error: 'Fetch failed', details: err.message });
  }
});

module.exports = router;
