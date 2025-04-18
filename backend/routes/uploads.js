const express = require('express');
const router = express.Router();

router.post('/new', (req, res) => {
  const { userId, imageUrl, location, summary } = req.body;
  console.log('Upload received:', { userId, imageUrl, location, summary });

  res.status(200).json({ message: 'Upload received successfully' });
});

module.exports = router;
