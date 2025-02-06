require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { API_KEYS, validateApiKeys } = require('./config/apiKeys');
const { validateEnvironment } = require('./config/environment');
const marketRoutes = require('./routes/market');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 2008;

// System Status Check
console.log('\nSystem Status Check');
console.log('=================');

// Check Environment
const envCheck = validateEnvironment();
console.log('\nEnvironment Status:');
console.log('-----------------');
if (envCheck.status) {
  console.log('✅ Environment configured correctly');
  console.log(`Mode: ${envCheck.config.NODE_ENV}`);
  console.log(`Port: ${envCheck.config.PORT}`);
  console.log(`Database: ${envCheck.config.MONGODB_URI ? 'Configured' : 'Not Configured'}`);
} else {
  console.log('❌ Missing environment variables:', envCheck.missing.join(', '));
  console.log('Please check your .env file');
}

// Check APIs
validateApiKeys();
const apiStatus = {
  // Core Market Data
  yahooFinance: '✓', // Free, no key needed
  finnhub: API_KEYS.FINNHUB ? '✓' : '✗',
  alphaVantage: API_KEYS.ALPHA_VANTAGE ? '✓' : '✗',
  polygon: API_KEYS.POLYGON ? '✓' : '✗',
  fmp: API_KEYS.FMP ? '✓' : '✗',
  
  // News & Data
  newsApi: API_KEYS.NEWS_API ? '✓' : '✗',
  fred: API_KEYS.FRED ? '✓' : '✗',
  
  // Free APIs
  binance: '✓', // Public API, no key needed
  coingecko: '✓' // Public API, no key needed
};

// Log API status
console.log('\nAPI Status:');
console.log('-----------');
Object.entries(apiStatus).forEach(([api, status]) => {
  console.log(`${api.padEnd(15)} ${status === '✓' ? '✅ Ready' : '❌ Not Configured'}`);
});

// Security Check
console.log('\nSecurity Status:');
console.log('---------------');
console.log(`JWT Secret: ${process.env.JWT_SECRET ? '✅ Configured' : '❌ Not Configured'}`);
console.log(`CORS: ${process.env.CORS_ORIGIN ? '✅ Restricted' : '⚠️  Open'}`);

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api', marketRoutes);

// Basic test endpoint
app.get('/test', (req, res) => {
  res.json({ 
    message: 'Server is running!',
    environment: {
      status: envCheck.status,
      mode: envCheck.config.NODE_ENV
    },
    apis: apiStatus,
    security: {
      jwt: !!process.env.JWT_SECRET,
      cors: !!process.env.CORS_ORIGIN
    }
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error('[Error]', err);
  res.status(err.status || 500).json({ 
    error: err.message || 'Internal server error',
    path: req.originalUrl
  });
});

// Start server
app.listen(PORT, () => {
  console.log('\nServer Status:');
  console.log('-------------');
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`Mode: ${process.env.NODE_ENV}`);
  console.log('\nTest the server with:');
  console.log(`curl http://localhost:${PORT}/test\n`);
});

module.exports = app; 