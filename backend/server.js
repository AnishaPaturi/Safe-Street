const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const uploadRoutes = require('./routes/upload');
const analyzeRoutes = require('./routes/analyze');

const app = express();
app.use(cors());
app.use(express.json());

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
  try {
    const form = new FormData();
    form.append('image', fs.createReadStream(req.file.path));

    const flaskURL = 'https://a4eb-183-82-237-45.ngrok-free.app/analyze'; 

    const response = await axios.post(flaskURL, form, {
      headers: form.getHeaders(),
    });

    console.log('✅ Flask Response:', response.data);

    fs.unlinkSync(req.file.path); // Clean up uploaded file
    res.json(response.data);
  } catch (err) {
    console.error('🔥 Analyze error:', err.message);
    res.status(500).json({ error: 'Failed to analyze image' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
