const express = require('express');
const router = express.Router();
const yahooFinance = require('yahoo-finance2').default;
const finnhubClient = require('../services/finnhub');

// Get option chain
router.get('/chain/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    
    // Get data from multiple sources for redundancy
    const [yahooData, finnhubData] = await Promise.all([
      yahooFinance.options(symbol),
      finnhubClient.optionChain(symbol)
    ]);

    // Merge and format the data
    const chain = mergeOptionChainData(yahooData, finnhubData);
    res.json(chain);
  } catch (error) {
    console.error('Option chain error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get specific option quote
router.get('/quote/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const quote = await yahooFinance.quote(symbol);
    res.json(quote);
  } catch (error) {
    console.error('Option quote error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get available expiration dates
router.get('/expirations/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const { expirationDates } = await yahooFinance.options(symbol);
    res.json(expirationDates);
  } catch (error) {
    console.error('Expiration dates error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get available strikes for expiration
router.get('/strikes/:symbol/:expiration', async (req, res) => {
  try {
    const { symbol, expiration } = req.params;
    const chain = await yahooFinance.options(symbol, { expiration });
    const strikes = new Set([
      ...chain.calls.map(call => call.strike),
      ...chain.puts.map(put => put.strike)
    ]);
    res.json(Array.from(strikes).sort((a, b) => a - b));
  } catch (error) {
    console.error('Strikes error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router; 