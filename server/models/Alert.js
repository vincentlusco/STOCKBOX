const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  symbol: { type: String, required: true },
  type: { type: String, required: true }, // PRICE, VOLUME, TECHNICAL, NEWS
  condition: {
    indicator: String, // price, volume, rsi, macd, etc.
    operator: String, // >, <, =, etc.
    value: Number,
    timeframe: String
  },
  status: { type: String, default: 'ACTIVE' },
  lastTriggered: Date,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Alert', alertSchema); 