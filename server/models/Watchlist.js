const mongoose = require('mongoose');

const watchlistSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  symbols: [{
    symbol: String,
    type: String,
    addedAt: { type: Date, default: Date.now },
    notes: String
  }],
  isDefault: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Watchlist', watchlistSchema); 