const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const yahooFinance = require('yahoo-finance2');

const app = express();
const PORT = process.env.PORT || 2008;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect('mongodb://localhost:27017/financial-terminal', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected successfully'))
.catch(err => console.error('MongoDB connection error:', err));

// Stock Quote Route
app.get('/api/quote/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const quote = await yahooFinance.quote(symbol);
    res.json(quote);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Watchlist Routes
app.get('/api/watchlist', async (req, res) => {
  // TODO: Implement watchlist functionality
  res.json([]);
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 