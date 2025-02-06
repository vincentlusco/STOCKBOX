// Add detailed logging for each endpoint
const logRequest = (type, symbol, data) => {
  console.log(`[API] ${type} request for ${symbol}`);
  console.log(`[API] Input data:`, { symbol, type });
  console.log(`[API] Response data:`, data);
};

// Example for quote endpoint
router.get('/quote/:symbol', async (req, res) => {
  const { symbol } = req.params;
  const { type } = req.query;
  
  console.log(`[Quote] Request for ${symbol} (${type})`);
  
  try {
    const data = await getQuote(symbol, type);
    logRequest('Quote', symbol, data);
    res.json(data);
  } catch (error) {
    console.error(`[Quote] Error:`, error);
    res.status(500).json({ error: error.message });
  }
}); 