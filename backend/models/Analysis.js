const mongoose = require('mongoose');

const analysisSchema = new mongoose.Schema({
  userId: { type: String, required: true }, // or ObjectId if you link to users
  imageUrl: { type: String, required: true },
  location: { type: String, required: true },
  summary: { type: String, required: true },
  caption: { type: String },
  date: { type: String, default: () => new Date().toLocaleDateString() }
});

module.exports = mongoose.model('Analysis', analysisSchema);

