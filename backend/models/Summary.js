const mongoose = require('mongoose');

const summarySchema = new mongoose.Schema({
  imageUrl: {
    type: String,
    required: true,
  },
  imageType: {
    type: String,
    required: true,
  },
  summary: {
    type: String,
    required: true,
  },
  address: {
    type: String,
    default: 'Address not provided',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
}, { versionKey: false });

module.exports = mongoose.model('Summary', summarySchema);
