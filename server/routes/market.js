const express = require('express');
const router = express.Router();
const { 
  yahooFinance, 
  finnhub, 
  alphaVantage,
  polygon,
  binance,
  oanda 
} = require('../services/providers');
const NewsService = require('../services/newsService');

// Debug middleware
router.use((req, res, next) => {
  console.log(`[API] ${req.method} ${req.path} - Query:`, req.query);
  next();
});

// Helper function to handle errors
const handleError = (error, res) => {
  console.error('[Error]', error);
  res.status(error.status || 500).json({ 
    error: error.message || 'Internal server error',
    code: error.code || 500
  });
};

// Helper function to validate request
const validateRequest = (req, res, next) => {
  const { symbol } = req.params;
  if (!symbol) {
    return res.status(400).json({ 
      error: 'Symbol is required',
      code: 400
    });
  }
  next();
};

// Universal search endpoint
router.get('/search', async (req, res) => {
  try {
    const { q: query } = req.query;
    const results = await Promise.all([
      yahooFinance.search(query),
      finnhub.symbolSearch(query),
      polygon.search(query)
    ]);
    
    // Merge and deduplicate results
    const merged = mergeSearchResults(results);
    res.json(merged);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Universal quote endpoint
router.get('/quote/:symbol', async (req, res) => {
  const { symbol } = req.params;
  const { type } = req.query;
  
  try {
    console.log(`[API] GET /quote/${symbol} - Query:`, req.query);
    
    // Validate inputs
    if (!symbol || !type) {
      return res.status(400).json({ 
        error: 'Missing required parameters' 
      });
    }

    // Try to get quote data
    const data = await dataAggregator.getQuote(symbol, type);
    
    // If no data returned but no error thrown
    if (!data) {
      return res.status(404).json({ 
        error: `No data found for ${symbol}` 
      });
    }

    res.json(data);

  } catch (error) {
    console.error(`[API] Error fetching quote for ${symbol}:`, error);
    
    // Send more specific error messages
    if (error.response?.status === 404) {
      return res.status(404).json({ 
        error: `Symbol ${symbol} not found` 
      });
    }
    
    res.status(500).json({ 
      error: `Failed to fetch quote data: ${error.message}` 
    });
  }
});

// Add a validation endpoint
router.get('/api/validate/:symbol', async (req, res) => {
  const { symbol } = req.params;
  const { type } = req.query;
  
  try {
    // Import yahooFinance at the top if not already imported
    const yahooFinance = require('yahoo-finance2').default;
    
    // Simple validation for development
    if (process.env.NODE_ENV === 'development') {
      return res.json({ valid: true });
    }

    const isValid = await dataAggregator.validateSymbol(symbol, type);
    if (isValid) {
      res.json({ valid: true });
    } else {
      res.status(404).json({ error: 'Invalid symbol' });
    }
  } catch (error) {
    console.error(`[Validation] Error for ${symbol}:`, error);
    res.status(500).json({ 
      error: error.message,
      ...(process.env.NODE_ENV === 'development' ? { stack: error.stack } : {})
    });
  }
});

// Financial Analysis endpoint
router.get('/fa/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const { type = 'STOCK' } = req.query;
    
    let yahooSymbol = symbol;
    if (type === 'FOREX') yahooSymbol = `${symbol}=X`;
    if (type === 'CRYPTO') yahooSymbol = `${symbol}-USD`;
    if (type === 'INDEX') yahooSymbol = `^${symbol}`;

    const result = await yahooFinance.quoteSummary(yahooSymbol, {
      modules: ['summaryDetail', 'defaultKeyStatistics', 'financialData']
    });

    if (!result) {
      throw new Error(`No data available for ${yahooSymbol}`);
    }

    const formattedFA = {
      financials: type === 'FOREX' ? {
        bid: result.summaryDetail?.bid,
        ask: result.summaryDetail?.ask,
        spread: result.summaryDetail?.ask - result.summaryDetail?.bid,
        dayRange: `${result.summaryDetail?.dayLow} - ${result.summaryDetail?.dayHigh}`,
        yearRange: `${result.summaryDetail?.fiftyTwoWeekLow} - ${result.summaryDetail?.fiftyTwoWeekHigh}`,
        volume: result.summaryDetail?.volume
      } : {
        peRatio: result.summaryDetail?.forwardPE,
        eps: result.defaultKeyStatistics?.forwardEps,
        revenueGrowth: result.financialData?.revenueGrowth,
        profitMargin: result.financialData?.profitMargins,
        operatingMargin: result.financialData?.operatingMargins,
        returnOnEquity: result.financialData?.returnOnEquity
      }
    };

    console.log('FA success:', yahooSymbol);
    res.json(formattedFA);
  } catch (error) {
    handleError(error, res);
  }
});

// Market Data endpoint
router.get('/mkt/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const type = req.query.type || 'STOCK';
    console.log(`Market data request for ${symbol} (${type})`);
    const market = await yahooFinance.getMarketData(symbol, type);
    res.json({ market });
  } catch (error) {
    handleError(error, res);
  }
});

// Health check endpoint
router.get('/ping', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Technical Analysis endpoint
router.get('/tech/:symbol', async (req, res) => {
  try {
    const symbol = req.params.symbol.toUpperCase();
    const type = (req.query.type || 'STOCK').toUpperCase();
    
    console.log(`[Tech] Request for ${symbol} (${type})`);
    const technical = await yahooFinance.getTechnicalAnalysis(symbol, type);
    
    if (!technical) {
      return res.status(404).json({ 
        error: `No technical data found for ${symbol}`,
        code: 404
      });
    }
    
    res.json({ technical });
  } catch (error) {
    console.error('[Error]', error);
    res.status(500).json({ 
      error: error.message || 'Internal server error',
      code: 500
    });
  }
});

// News endpoint
router.get('/news/:symbol', async (req, res) => {
  try {
    const symbol = req.params.symbol.toUpperCase();
    const type = (req.query.type || 'STOCK').toUpperCase();
    
    console.log(`[News] Request for ${symbol} (${type})`);
    const news = await NewsService.getNews(symbol, type);
    
    res.json({ 
      news,
      status: news === NewsService.fallbackNews ? 'fallback' : 'live',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[News] Error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch news',
      fallback: NewsService.fallbackNews,
      status: 'error'
    });
  }
});

// Test endpoint
router.get('/test', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    endpoints: [
      '/api/quote/:symbol',
      '/api/tech/:symbol',
      '/api/news/:symbol'
    ]
  });
});

// Watchlist endpoints
router.post('/watchlist/default/symbol', async (req, res) => {
  try {
    const { symbol, type } = req.body;
    console.log(`[Watchlist] Adding ${symbol} (${type})`);
    
    // In-memory storage for now
    if (!global.watchlist) global.watchlist = new Set();
    global.watchlist.add({ symbol, type });
    
    res.json({ status: 'ok', message: `Added ${symbol} to watchlist` });
  } catch (error) {
    console.error('[Watchlist] Error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/watchlist/default/live', async (req, res) => {
  try {
    console.log('[Watchlist] Getting live data');
    
    if (!global.watchlist) {
      return res.json({ symbols: [] });
    }

    // Get live data for each symbol
    const symbols = await Promise.all(
      Array.from(global.watchlist).map(async ({ symbol, type }) => {
        try {
          const quote = await yahooFinance.getQuote(symbol, type);
          return {
            symbol,
            type,
            data: { quote }
          };
        } catch (error) {
          console.warn(`[Watchlist] Failed to get data for ${symbol}:`, error.message);
          return { symbol, type, data: null };
        }
      })
    );
    
    res.json({ symbols });
  } catch (error) {
    console.error('[Watchlist] Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Add error handling middleware
router.use((err, req, res, next) => {
  console.error('[API Error]', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' ? { stack: err.stack } : {})
  });
});

module.exports = router; 