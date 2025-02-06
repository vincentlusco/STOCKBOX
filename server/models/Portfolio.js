const mongoose = require('mongoose');

const portfolioSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  positions: [{
    symbol: String,
    type: String,
    shares: Number,
    entryPrice: Number,
    entryDate: Date,
    notes: String
  }],
  cash: { type: Number, default: 0 },
  isDefault: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Portfolio', portfolioSchema); 