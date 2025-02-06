import axios from 'axios';
import { apiKeys } from '../config/apiKeys';
import { EnhancedRateLimiter } from '../utils/rateLimiter';
import { Cache } from '../utils/cache';

// Initialize API clients with ALL approved APIs
const apis = {
  yahoo: axios.create({
    baseURL: 'https://query1.finance.yahoo.com/v8/finance'
  }),
  
  alphavantage: axios.create({
    baseURL: 'https://www.alphavantage.co/query',
    params: { apikey: apiKeys.ALPHA_VANTAGE }
  }),
  
  polygon: axios.create({
    baseURL: 'https://api.polygon.io/v2',
    params: { apiKey: apiKeys.POLYGON }
  }),
  
  finnhub: axios.create({
    baseURL: 'https://finnhub.io/api/v1',
    headers: { 'X-Finnhub-Token': apiKeys.FINNHUB }
  }),
  
  fmp: axios.create({
    baseURL: 'https://financialmodelingprep.com/api/v3',
    params: { apikey: apiKeys.FMP }
  }),
  
  newsapi: axios.create({
    baseURL: 'https://newsapi.org/v2',
    params: { apiKey: apiKeys.NEWS_API }
  }),

  fred: axios.create({
    baseURL: 'https://api.stlouisfed.org/fred',
    params: { api_key: apiKeys.FRED }
  }),

  binance: axios.create({
    baseURL: 'https://api.binance.com/api/v3'
  }),
  
  coingecko: axios.create({
    baseURL: 'https://api.coingecko.com/api/v3'
  })
};

export class DataAggregator {
  constructor() {
    this.cache = new Cache();
  }

  // Stock Methods
  async getStockQuote(symbol) {
    const cacheKey = `quote:${symbol}`;
    const cached = this.cache.get(cacheKey);
    if (cached) return cached;

    try {
      const response = await apis.yahoo.get(`/quote/${symbol}`);
      const data = response.data;
      
      this.cache.set(cacheKey, data, 10000); // 10 second cache
      return data;
    } catch (error) {
      console.error('Error fetching stock quote:', error);
      throw new Error('Unable to fetch stock quote');
    }
  }

  async getFundamentals(symbol) {
    const cacheKey = `fundamentals:${symbol}`;
    const cached = this.cache.get(cacheKey);
    if (cached) return cached;

    try {
      const [profile, metrics] = await Promise.all([
        apis.fmp.get(`/profile/${symbol}`),
        apis.fmp.get(`/key-metrics/${symbol}`)
      ]);

      const data = {
        profile: profile.data[0],
        metrics: metrics.data[0]
      };

      this.cache.set(cacheKey, data, 3600000); // 1 hour cache
      return data;
    } catch (error) {
      console.error('Error fetching fundamentals:', error);
      throw new Error('Unable to fetch fundamental data');
    }
  }

  // More Stock Methods
  async getTechnicalData(symbol) {
    const cacheKey = `technical:${symbol}`;
    const cached = this.cache.get(cacheKey);
    if (cached) return cached;

    try {
      const [sma, rsi, macd] = await Promise.all([
        apis.alphavantage.get('', {
          params: {
            function: 'SMA',
            symbol,
            interval: 'daily',
            time_period: 20,
            series_type: 'close'
          }
        }),
        apis.alphavantage.get('', {
          params: {
            function: 'RSI',
            symbol,
            interval: 'daily',
            time_period: 14,
            series_type: 'close'
          }
        }),
        apis.alphavantage.get('', {
          params: {
            function: 'MACD',
            symbol,
            interval: 'daily',
            series_type: 'close'
          }
        })
      ]);

      const data = {
        sma: sma.data['Technical Analysis: SMA'],
        rsi: rsi.data['Technical Analysis: RSI'],
        macd: macd.data['Technical Analysis: MACD']
      };

      this.cache.set(cacheKey, data, 300000); // 5 minute cache
      return data;
    } catch (error) {
      console.error('Error fetching technical data:', error);
      throw new Error('Unable to fetch technical data');
    }
  }

  async getNews(symbol) {
    const cacheKey = `news:${symbol}`;
    const cached = this.cache.get(cacheKey);
    if (cached) return cached;

    try {
      const response = await apis.yahoo.get('/everything', {
        params: {
          q: symbol,
          sortBy: 'publishedAt',
          pageSize: 10
        }
      });

      this.cache.set(cacheKey, response.data.articles, 900000); // 15 minute cache
      return response.data.articles;
    } catch (error) {
      console.error('Error fetching news:', error);
      throw new Error('Unable to fetch news');
    }
  }

  // Crypto Methods
  async getCryptoQuote(symbol) {
    const cacheKey = `crypto:${symbol}`;
    const cached = this.cache.get(cacheKey);
    if (cached) return cached;

    try {
      const response = await apis.yahoo.get('/ticker/24hr', {
        params: { symbol: symbol.replace('-', '') }
      });
      
      const data = {
        lastPrice: parseFloat(response.data.lastPrice),
        priceChange: parseFloat(response.data.priceChange),
        priceChangePercent: parseFloat(response.data.priceChangePercent),
        volume: parseFloat(response.data.volume),
        quoteVolume: parseFloat(response.data.quoteVolume),
        highPrice: parseFloat(response.data.highPrice),
        lowPrice: parseFloat(response.data.lowPrice)
      };

      this.cache.set(cacheKey, data, 5000); // 5 second cache
      return data;
    } catch (error) {
      console.error('Error fetching crypto quote:', error);
      throw new Error('Unable to fetch crypto quote');
    }
  }

  async getCryptoMarket(symbol) {
    const cacheKey = `crypto_market:${symbol}`;
    const cached = this.cache.get(cacheKey);
    if (cached) return cached;

    try {
      const response = await apis.yahoo.get('/ticker/24hr', {
        params: { symbol: symbol.replace('-', '') }
      });

      const data = {
        marketCap: parseFloat(response.data.marketCap),
        totalVolume: parseFloat(response.data.totalVolume),
        circulatingSupply: parseFloat(response.data.circulatingSupply),
        totalSupply: parseFloat(response.data.totalSupply),
        maxSupply: parseFloat(response.data.maxSupply)
      };

      this.cache.set(cacheKey, data, 300000); // 5 minute cache
      return data;
    } catch (error) {
      console.error('Error fetching crypto market data:', error);
      throw new Error('Unable to fetch market data');
    }
  }

  // Forex Methods
  async getForexRate(symbol) {
    const cacheKey = `forex:${symbol}`;
    const cached = this.cache.get(cacheKey);
    if (cached) return cached;

    try {
      const response = await apis.alphavantage.get('', {
        params: {
          function: 'CURRENCY_EXCHANGE_RATE',
          from_currency: symbol.split('/')[0],
          to_currency: symbol.split('/')[1]
        }
      });

      const data = response.data['Realtime Currency Exchange Rate'];
      this.cache.set(cacheKey, data, 60000); // 1 minute cache
      return data;
    } catch (error) {
      console.error('Error fetching forex rate:', error);
      throw new Error('Unable to fetch exchange rate');
    }
  }

  // Options Methods
  async getOptionsChain(symbol) {
    const cacheKey = `options:${symbol}`;
    const cached = this.cache.get(cacheKey);
    if (cached) return cached;

    try {
      const response = await apis.yahoo.get(`/options/${symbol}`);
      const data = response.data;
      this.cache.set(cacheKey, data, 60000); // 1 minute cache
      return data;
    } catch (error) {
      console.error('Error fetching options chain:', error);
      throw new Error('Unable to fetch options data');
    }
  }

  // ETF Methods
  async getETFData(symbol) {
    const cacheKey = `etf:${symbol}`;
    const cached = this.cache.get(cacheKey);
    if (cached) return cached;

    try {
      const [profile, holdings] = await Promise.all([
        apis.fmp.get(`/etf-holder/${symbol}`),
        apis.fmp.get(`/etf-info/${symbol}`)
      ]);

      const data = {
        holdings: profile.data,
        info: holdings.data[0]
      };

      this.cache.set(cacheKey, data, 3600000); // 1 hour cache
      return data;
    } catch (error) {
      console.error('Error fetching ETF data:', error);
      throw new Error('Unable to fetch ETF data');
    }
  }
}

export const dataAggregator = new DataAggregator(); 