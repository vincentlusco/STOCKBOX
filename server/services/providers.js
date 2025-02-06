const yahooFinance = require('yahoo-finance2').default;
const finnhub = require('finnhub');
const axios = require('axios');
const WebSocket = require('ws');

// Load environment variables
const {
  FINNHUB_API_KEY,
  ALPHA_VANTAGE_API_KEY,
  POLYGON_API_KEY,
  NEWS_API_KEY,
  FMP_API_KEY
} = process.env;

// Initialize Finnhub
const finnhubClient = new finnhub.DefaultApi({
  apiKey: FINNHUB_API_KEY
});

// Initialize providers
const providers = {
  // Primary providers (Yahoo Finance is free!)
  yahooFinance: {
    ...yahooFinance,
    // Add custom methods
    getRealTimeQuote: async (symbol) => {
      return await yahooFinance.quote(symbol);
    }
  },

  // Finnhub (you have key)
  finnhub: finnhubClient,

  // Alpha Vantage (you have key)
  alphaVantage: {
    baseURL: 'https://www.alphavantage.co/query',
    async search(query) {
      const response = await axios.get(this.baseURL, {
        params: {
          function: 'SYMBOL_SEARCH',
          keywords: query,
          apikey: ALPHA_VANTAGE_API_KEY
        }
      });
      return response.data;
    },
    async getQuote(symbol) {
      const response = await axios.get(this.baseURL, {
        params: {
          function: 'GLOBAL_QUOTE',
          symbol,
          apikey: ALPHA_VANTAGE_API_KEY
        }
      });
      return response.data;
    }
  },

  // Polygon (you have key)
  polygon: {
    baseURL: 'https://api.polygon.io',
    headers: { Authorization: `Bearer ${POLYGON_API_KEY}` },
    async search(query) {
      const response = await axios.get(`${this.baseURL}/v3/reference/tickers`, {
        params: { search: query },
        headers: this.headers
      });
      return response.data;
    },
    async getQuote(symbol) {
      const response = await axios.get(`${this.baseURL}/v2/aggs/ticker/${symbol}/prev`, {
        headers: this.headers
      });
      return response.data;
    }
  },

  // Financial Modeling Prep (you have key)
  fmp: {
    baseURL: 'https://financialmodelingprep.com/api/v3',
    async getFinancials(symbol) {
      const response = await axios.get(
        `${this.baseURL}/income-statement/${symbol}?apikey=${FMP_API_KEY}`
      );
      return response.data;
    },
    async getQuote(symbol) {
      const response = await axios.get(
        `${this.baseURL}/quote/${symbol}?apikey=${FMP_API_KEY}`
      );
      return response.data;
    }
  },

  // Crypto providers (Binance public API - no key needed)
  binance: {
    baseURL: 'https://api.binance.com/api/v3',
    async getPrice(symbol) {
      const response = await axios.get(`${this.baseURL}/ticker/price`, {
        params: { symbol }
      });
      return response.data;
    },
    async getKlines(symbol, interval = '1d') {
      const response = await axios.get(`${this.baseURL}/klines`, {
        params: { 
          symbol,
          interval,
          limit: 100
        }
      });
      return response.data;
    }
  },

  // CoinGecko (free API - no key needed)
  coingecko: {
    baseURL: 'https://api.coingecko.com/api/v3',
    async getPrice(cryptoId) {
      const response = await axios.get(`${this.baseURL}/simple/price`, {
        params: {
          ids: cryptoId,
          vs_currencies: 'usd',
          include_24hr_change: true
        }
      });
      return response.data;
    },
    async search(query) {
      const response = await axios.get(`${this.baseURL}/search`, {
        params: { query }
      });
      return response.data;
    }
  }
};

// Add error handling wrapper
Object.keys(providers).forEach(provider => {
  const methods = providers[provider];
  Object.keys(methods).forEach(method => {
    if (typeof methods[method] === 'function') {
      const original = methods[method];
      methods[method] = async (...args) => {
        try {
          return await original.apply(methods, args);
        } catch (error) {
          console.error(`Error in ${provider}.${method}:`, error);
          throw error;
        }
      };
    }
  });
});

module.exports = providers; 