const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs');
const Summary = require('../models/Summary');

// Multer storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname),
});
const upload = multer({ storage });

// POST /api/upload/new
router.post('/new', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image uploaded.' });
    }

    const { location, summary } = req.body;

    if (!location || !summary) {
      return res.status(400).json({ error: 'Location and summary are required.' });
    }

    // No longer save raw imageData into MongoDB to avoid memory issues

    const newSummary = new Summary({
      imageUrl: `/uploads/${req.file.filename}`, // Save the file path (relative)
      imageType: req.file.mimetype,
      summary,
      address: location,
    });

    await newSummary.save();
    console.log('✅ Summary saved successfully');

    // Clean up temporary uploaded file
    fs.unlink(req.file.path, (err) => {
      if (err) console.error('Failed to delete uploaded file:', err);
    });

    res.status(201).json({
      message: 'Upload successful!',
      data: {
        summary: newSummary.summary,
        address: newSummary.address,
        imageUrl: newSummary.imageUrl,
        createdAt: newSummary.createdAt,
      },
    });

  } catch (error) {
    console.error('🔥 Upload Error:', error);
    res.status(500).json({ error: 'Failed to save upload' });
  }
});

module.exports = router;
