const express = require('express');
const router = express.Router();
const Watchlist = require('../models/Watchlist');
const YahooFinanceService = require('../services/yahooFinance');
const auth = require('../middleware/auth');

// Get all watchlists
router.get('/', auth, async (req, res) => {
  try {
    const watchlists = await Watchlist.find({ userId: req.user.id });
    res.json(watchlists);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create watchlist
router.post('/', auth, async (req, res) => {
  try {
    const watchlist = new Watchlist({
      userId: req.user.id,
      name: req.body.name,
      symbols: req.body.symbols || []
    });
    await watchlist.save();
    res.json(watchlist);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add symbol to watchlist
router.post('/:id/symbol', auth, async (req, res) => {
  try {
    const watchlist = await Watchlist.findById(req.params.id);
    watchlist.symbols.push({
      symbol: req.body.symbol,
      type: req.body.type,
      notes: req.body.notes
    });
    await watchlist.save();
    res.json(watchlist);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get watchlist with live data
router.get('/:id/live', auth, async (req, res) => {
  try {
    const watchlist = await Watchlist.findById(req.params.id);
    if (!watchlist) {
      return res.status(404).json({ error: 'Watchlist not found' });
    }

    // Fetch live data for all symbols
    const liveData = await Promise.all(
      watchlist.symbols.map(async ({ symbol, type }) => {
        try {
          const quote = await YahooFinanceService.getQuote(symbol, type);
          return {
            symbol,
            type,
            data: quote
          };
        } catch (err) {
          console.error(`Error fetching data for ${symbol}:`, err);
          return {
            symbol,
            type,
            error: err.message
          };
        }
      })
    );

    res.json({
      ...watchlist.toObject(),
      liveData
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router; 