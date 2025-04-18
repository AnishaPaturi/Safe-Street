const mongoose = require('mongoose');

const uploadSchema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  imageUrl: String,
  location: String,
  summary: String,
  status: { type: String, default: 'pending' },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Upload', uploadSchema);
