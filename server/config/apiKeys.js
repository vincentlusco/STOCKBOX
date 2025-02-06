require('dotenv').config();

const API_KEYS = {
  // Core Market Data
  ALPHA_VANTAGE: process.env.ALPHA_VANTAGE_API_KEY,
  POLYGON: process.env.POLYGON_API_KEY,
  FINNHUB: process.env.FINNHUB_API_KEY,
  FMP: process.env.FMP_API_KEY,
  
  // News & Economic Data
  NEWS_API: process.env.NEWS_API_KEY,
  FRED: process.env.FRED_API_KEY,
  
  // Forex
  EXCHANGE_RATE_API: process.env.EXCHANGE_RATE_API_KEY
};

// Validate required API keys
const validateApiKeys = () => {
  const missingKeys = [];
  Object.entries(API_KEYS).forEach(([name, key]) => {
    if (!key) missingKeys.push(name);
  });
  
  if (missingKeys.length > 0) {
    console.warn('\nWarning: Missing API keys for:', missingKeys.join(', '));
    console.warn('Some functionality may be limited.\n');
  }
};

// Export API keys and validation
module.exports = {
  API_KEYS,
  validateApiKeys
}; 