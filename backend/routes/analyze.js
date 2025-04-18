const express = require('express');
const router = express.Router();
const Analysis = require('../models/Analysis');

router.post('/save', async (req, res) => {
  const { userId, imageUrl, location, summary, caption, date } = req.body;

  try {
    const newAnalysis = new Analysis({ userId, imageUrl, location, summary, caption, date });
    await newAnalysis.save();
    res.status(201).json({ message: 'Analysis saved', analysis: newAnalysis });
  } catch (err) {
    console.error('Save error:', err);
    res.status(500).json({ error: 'Failed to save analysis' });
  }
});

module.exports = router;
