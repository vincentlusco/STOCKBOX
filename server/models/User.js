const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: String,
  settings: {
    defaultTimeframe: { type: String, default: '1D' },
    defaultChartType: { type: String, default: 'CANDLE' },
    theme: { type: String, default: 'dark' }
  },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema); 