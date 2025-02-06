import axios from 'axios';
import { config } from '../config';
import { calculateRSI, calculateMACD, calculateSMA, calculateBollingerBands } from '../utils/technicalAnalysis';
import { RateLimiter } from '../utils/rateLimiter';
import { Cache } from '../utils/cache';
import { withRetry, APIError } from '../utils/errorHandling';

// API clients
const yahoo = axios.create({
  baseURL: 'https://query2.finance.yahoo.com/v8/finance',
  headers: {
    'User-Agent': 'Mozilla/5.0'
  }
});

const binance = axios.create({
  baseURL: 'https://api.binance.com/api/v3'
});

const exchangeRates = axios.create({
  baseURL: 'https://api.exchangerate.host'
});

const fred = axios.create({
  baseURL: 'https://api.stlouisfed.org/fred/series'
});

const coinStats = axios.create({
  baseURL: 'https://api.coinstats.app/public/v1'
});

const newsapi = axios.create({
  baseURL: 'https://newsapi.org/v2',
  params: {
    apiKey: config.NEWS_API_KEY
  }
});

// Add SEC EDGAR client
const edgar = axios.create({
  baseURL: 'https://data.sec.gov/api',
  headers: {
    'User-Agent': 'StockBox Terminal contact@stockbox.com', // Required by SEC
    'Accept-Encoding': 'gzip, deflate',
    'Host': 'data.sec.gov'
  }
});

// Rate limiters for different APIs
const rateLimiters = {
  yahoo: new RateLimiter(30, 60000),      // 30 requests per minute
  binance: new RateLimiter(20, 60000),     // 20 requests per minute
  fred: new RateLimiter(5, 60000),         // 5 requests per minute
  exchangeRates: new RateLimiter(30, 60000) // 30 requests per minute
};

// Caches for different data types
const caches = {
  stock: new Cache(60000),      // 1 minute TTL
  crypto: new Cache(30000),     // 30 seconds TTL
  forex: new Cache(60000),      // 1 minute TTL
  bonds: new Cache(300000),     // 5 minutes TTL
  options: new Cache(60000)     // 1 minute TTL
};

// Required API configurations
const APIs = {
  // Already using:
  yahoo: {
    baseURL: 'https://query2.finance.yahoo.com/v8/finance',
    key: process.env.YAHOO_FINANCE_API_KEY,
    // Used for: PRICE, VOL, DIV, NEWS, EARN, DES
  },

  // Need to add:
  alphavantage: {
    baseURL: 'https://www.alphavantage.co/query',
    key: process.env.ALPHA_VANTAGE_KEY,
    // For: GROWTH, MARGIN, RATIO, technical indicators
  },

  finnhub: {
    baseURL: 'https://finnhub.io/api/v1',
    key: process.env.FINNHUB_API_KEY,
    // For: ESG, MGMT, SECTOR analysis
  },

  fmp: {
    baseURL: 'https://financialmodelingprep.com/api/v3',
    key: process.env.FMP_API_KEY,
    // For: SEC filings, detailed financials
  },

  sec: {
    baseURL: 'https://data.sec.gov/api',
    // For: SEC filings (free, but needs proper user agent)
  }
};

export const apiService = {
  // Stock Data (Yahoo Finance)
  async getStockData(symbol) {
    try {
      const cached = caches.stock.get(symbol);
      if (cached) return cached;

      await rateLimiters.yahoo.throttle();

      const data = await withRetry(async () => {
        try {
          // Try Yahoo Finance first
          return await this._fetchStockData(symbol);
        } catch (error) {
          // If Yahoo fails, try Alpha Vantage as fallback
          if (config.ALPHA_VANTAGE_KEY) {
            return await this._fetchStockDataAlphaVantage(symbol);
          }
          throw error;
        }
      });

      caches.stock.set(symbol, data);
      return data;
    } catch (error) {
      console.error('Error in getStockData:', error);
      throw new APIError(
        `Failed to fetch stock data for ${symbol}: ${error.message}`,
        error.statusCode || 500
      );
    }
  },

  // Crypto Data (Binance)
  async getCryptoData(symbol) {
    try {
      const cached = caches.crypto.get(symbol);
      if (cached) return cached;

      await rateLimiters.binance.throttle();

      const data = await withRetry(async () => {
        try {
          // Try Binance first
          return await this._fetchCryptoData(symbol);
        } catch (error) {
          // If Binance fails, try CoinGecko as fallback
          return await this._fetchCryptoDataCoinGecko(symbol);
        }
      });

      caches.crypto.set(symbol, data);
      return data;
    } catch (error) {
      console.error('Error in getCryptoData:', error);
      throw new APIError(
        `Failed to fetch crypto data for ${symbol}: ${error.message}`,
        error.statusCode || 500
      );
    }
  },

  // Forex Data (Exchange Rates API)
  async getForexData(symbol) {
    try {
      const cached = caches.forex.get(symbol);
      if (cached) return cached;

      await rateLimiters.exchangeRates.throttle();

      const baseCurrency = symbol.split('=')[0];
      const quoteCurrency = 'USD';

      const [current, history] = await Promise.all([
        exchangeRates.get('/latest', {
          params: {
            base: baseCurrency,
            symbols: quoteCurrency
          }
        }),
        exchangeRates.get('/timeseries', {
          params: {
            base: baseCurrency,
            symbols: quoteCurrency,
            start_date: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            end_date: new Date().toISOString().split('T')[0]
          }
        })
      ]);

      // Calculate technical indicators from historical data
      const prices = Object.values(history.data.rates).map(r => r[quoteCurrency]);
      const technicalData = {
        rsi: calculateRSI(prices),
        macd: calculateMACD(prices),
        sma: {
          sma20: calculateSMA(prices, 20),
          sma50: calculateSMA(prices, 50),
          sma200: calculateSMA(prices, 200)
        }
      };

      const data = {
        quote: {
          rate: current.data.rates[quoteCurrency],
          timestamp: current.data.timestamp
        },
        history: history.data.rates,
        technical: technicalData
      };
      
      // Cache the result
      caches.forex.set(symbol, data);
      
      return data;
    } catch (error) {
      console.error('Error in getForexData:', error);
      throw error;
    }
  },

  // Bond Data (FRED)
  async getBondData(symbol) {
    try {
      const cached = caches.bonds.get(symbol);
      if (cached) return cached;

      await rateLimiters.fred.throttle();

      const seriesId = getBondSeriesId(symbol); // Helper to map symbol to FRED series ID
      
      const response = await fred.get('', {
        params: {
          series_id: seriesId,
          api_key: config.FRED_API_KEY,
          file_type: 'json'
        }
      });

      const data = {
        quote: {
          price: response.data.observations[0].value,
          timestamp: response.data.observations[0].date
        },
        history: response.data.observations
      };
      
      // Cache the result
      caches.bonds.set(symbol, data);
      
      return data;
    } catch (error) {
      console.error('Error in getBondData:', error);
      throw error;
    }
  },

  // Options Data (Yahoo Finance)
  async getOptionsData(symbol) {
    try {
      const cached = caches.options.get(symbol);
      if (cached) return cached;

      await rateLimiters.yahoo.throttle();

      const response = await yahoo.get(`/options/${symbol}`);
      const chain = response.data.optionChain.result[0];

      const data = {
        quote: chain.quote,
        strikes: chain.strikes,
        expirationDates: chain.expirationDates,
        calls: chain.options[0].calls,
        puts: chain.options[0].puts
      };
      
      // Cache the result
      caches.options.set(symbol, data);
      
      return data;
    } catch (error) {
      console.error('Error in getOptionsData:', error);
      throw error;
    }
  },

  // Stock Data
  async getStockPrice(symbol) {
    try {
      const { data } = await yahoo.get(`/chart/${symbol}?interval=1d&range=1d`);
      const quote = data.chart.result[0].meta;
      const indicators = data.chart.result[0].indicators.quote[0];
      
      return {
        price: quote.regularMarketPrice,
        change: quote.regularMarketPrice - quote.previousClose,
        changePercent: ((quote.regularMarketPrice - quote.previousClose) / quote.previousClose) * 100,
        volume: indicators.volume[indicators.volume.length - 1],
        avgVolume: quote.averageDailyVolume3Month,
        marketCap: quote.marketCap,
        dayHigh: quote.regularMarketDayHigh,
        dayLow: quote.regularMarketDayLow
      };
    } catch (error) {
      console.error('Error fetching stock price:', error);
      throw error;
    }
  },

  async getStockDetails(symbol) {
    try {
      const { data } = await yahoo.get(`/quoteSummary/${symbol}?modules=summaryDetail,financialData,defaultKeyStatistics`);
      const summary = data.quoteSummary.result[0];
      
      return {
        peRatio: summary.summaryDetail.trailingPE,
        eps: summary.defaultKeyStatistics.trailingEps,
        dividend: summary.summaryDetail.dividendYield,
        beta: summary.defaultKeyStatistics.beta,
        week52High: summary.summaryDetail.fiftyTwoWeekHigh,
        week52Low: summary.summaryDetail.fiftyTwoWeekLow,
        avgVolume: summary.summaryDetail.averageVolume,
        marketCap: summary.summaryDetail.marketCap
      };
    } catch (error) {
      console.error('Error fetching stock details:', error);
      throw error;
    }
  },

  async getStockNews(symbol) {
    try {
      const { data } = await yahoo.get(`/quoteSummary/${symbol}?modules=news`);
      return data.quoteSummary.result[0].news;
    } catch (error) {
      console.error('Error fetching stock news:', error);
      throw error;
    }
  },

  // Crypto Data using Binance API
  async getCryptoPrice(symbol) {
    try {
      // Convert symbol format (e.g., BTC-USD to BTCUSDT)
      const binanceSymbol = symbol.replace('-', '').toUpperCase() + 'T';
      
      // Get 24hr ticker data
      const [tickerRes, depthRes] = await Promise.all([
        binance.get('/ticker/24hr', { params: { symbol: binanceSymbol } }),
        binance.get('/depth', { params: { symbol: binanceSymbol, limit: 5 } })
      ]);

      const ticker = tickerRes.data;
      const depth = depthRes.data;

      return {
        price: parseFloat(ticker.lastPrice),
        change24h: parseFloat(ticker.priceChange),
        changePercent: parseFloat(ticker.priceChangePercent),
        volume24h: parseFloat(ticker.volume),
        high24h: parseFloat(ticker.highPrice),
        low24h: parseFloat(ticker.lowPrice),
        weightedAvgPrice: parseFloat(ticker.weightedAvgPrice),
        bidPrice: parseFloat(depth.bids[0][0]),
        askPrice: parseFloat(depth.asks[0][0]),
        bidQty: parseFloat(depth.bids[0][1]),
        askQty: parseFloat(depth.asks[0][1])
      };
    } catch (error) {
      // Fallback to CoinStats if not found on Binance
      try {
        const { data } = await coinStats.get('/coins', {
          params: {
            currency: 'USD',
            limit: 1,
            search: symbol.split('-')[0]
          }
        });

        const coin = data.coins[0];
        return {
          price: coin.price,
          change24h: coin.priceChange1d,
          changePercent: coin.priceChange1d,
          volume24h: coin.volume,
          marketCap: coin.marketCap,
          high24h: null, // Not available in CoinStats
          low24h: null,
          weightedAvgPrice: null
        };
      } catch (fallbackError) {
        console.error('Error fetching crypto price from both APIs:', error, fallbackError);
        throw error;
      }
    }
  },

  async getCryptoMarketData(symbol) {
    try {
      const binanceSymbol = symbol.replace('-', '').toUpperCase() + 'T';
      
      // Get various market data endpoints
      const [klines, trades] = await Promise.all([
        binance.get('/klines', {
          params: {
            symbol: binanceSymbol,
            interval: '1d',
            limit: 30
          }
        }),
        binance.get('/trades', {
          params: {
            symbol: binanceSymbol,
            limit: 50
          }
        })
      ]);

      return {
        recentTrades: trades.data.map(trade => ({
          price: parseFloat(trade.price),
          quantity: parseFloat(trade.qty),
          time: trade.time,
          isBuyerMaker: trade.isBuyerMaker
        })),
        priceHistory: klines.data.map(k => ({
          time: k[0],
          open: parseFloat(k[1]),
          high: parseFloat(k[2]),
          low: parseFloat(k[3]),
          close: parseFloat(k[4]),
          volume: parseFloat(k[5])
        }))
      };
    } catch (error) {
      console.error('Error fetching crypto market data:', error);
      throw error;
    }
  },

  async getCryptoOrderBook(symbol) {
    try {
      const binanceSymbol = symbol.replace('-', '').toUpperCase() + 'T';
      
      const { data } = await binance.get('/depth', {
        params: {
          symbol: binanceSymbol,
          limit: 100 // Get top 100 bids and asks
        }
      });

      return {
        bids: data.bids.map(b => ({
          price: parseFloat(b[0]),
          quantity: parseFloat(b[1])
        })),
        asks: data.asks.map(a => ({
          price: parseFloat(a[0]),
          quantity: parseFloat(a[1])
        }))
      };
    } catch (error) {
      console.error('Error fetching crypto order book:', error);
      throw error;
    }
  },

  // Technical Analysis using Yahoo data
  async getTechnicalIndicators(symbol) {
    try {
      const { data } = await yahoo.get(`/chart/${symbol}?interval=1d&range=3mo`);
      const prices = data.chart.result[0].indicators.quote[0].close;
      
      return {
        rsi: calculateRSI(prices),
        macd: calculateMACD(prices),
        sma: {
          sma20: calculateSMA(prices, 20),
          sma50: calculateSMA(prices, 50),
          sma200: calculateSMA(prices, 200)
        },
        bollingerBands: calculateBollingerBands(prices),
        priceData: {
          current: prices[prices.length - 1],
          change: prices[prices.length - 1] - prices[prices.length - 2],
          changePercent: ((prices[prices.length - 1] - prices[prices.length - 2]) / prices[prices.length - 2]) * 100
        }
      };
    } catch (error) {
      console.error('Error fetching technical indicators:', error);
      throw error;
    }
  },

  // SEC EDGAR Data
  async getInstitutionalHoldings(symbol) {
    return secRateLimiter.execute(() => this.getInstitutionalHoldings(symbol));
  },

  async getInsiderTrading(symbol) {
    return secRateLimiter.execute(() => this.getInsiderTrading(symbol));
  },

  async getCompanyFilings(symbol) {
    return secRateLimiter.execute(() => this.getCompanyFilings(symbol));
  },

  // Add fallback methods
  async _fetchStockDataAlphaVantage(symbol) {
    const response = await axios.get(`https://www.alphavantage.co/query`, {
      params: {
        function: 'GLOBAL_QUOTE',
        symbol,
        apikey: config.ALPHA_VANTAGE_KEY
      }
    });

    // Transform Alpha Vantage data to match our format
    return this._transformAlphaVantageData(response.data);
  },

  async _fetchCryptoDataCoinGecko(symbol) {
    const coin = symbol.split('-')[0].toLowerCase();
    const response = await axios.get(`https://api.coingecko.com/api/v3/coins/${coin}`);

    // Transform CoinGecko data to match our format
    return this._transformCoinGeckoData(response.data);
  },

  // Data transformation helpers
  _transformAlphaVantageData(data) {
    const quote = data['Global Quote'];
    return {
      price: parseFloat(quote['05. price']),
      change: parseFloat(quote['09. change']),
      changePercent: parseFloat(quote['10. change percent'].replace('%', '')),
      volume: parseInt(quote['06. volume']),
      // ... transform other fields
    };
  },

  _transformCoinGeckoData(data) {
    return {
      price: data.market_data.current_price.usd,
      change24h: data.market_data.price_change_24h,
      changePercent: data.market_data.price_change_percentage_24h,
      volume: data.market_data.total_volume.usd,
      // ... transform other fields
    };
  },

  // New method to fetch comprehensive stock data
  async getStockData(symbol) {
    try {
      const [
        yahooData,
        alphaVantageData,
        finnhubData,
        fmpData,
        secData
      ] = await Promise.all([
        fetchYahooData(symbol),
        fetchAlphaVantageData(symbol),
        fetchFinnhubData(symbol),
        fetchFMPData(symbol),
        fetchSECData(symbol)
      ]);

      return {
        ...yahooData,
        growth: alphaVantageData.growth,
        margins: alphaVantageData.margins,
        ratios: alphaVantageData.ratios,
        esg: finnhubData.esg,
        sector: finnhubData.sector,
        management: finnhubData.management,
        secFilings: secData.filings,
        additionalFinancials: fmpData.financials
      };
    } catch (error) {
      console.error('Error fetching stock data:', error);
      throw error;
    }
  }
};

// Technical Analysis Helper Functions
function calculateRSI(prices, period = 14) {
  if (!prices || prices.length < period + 1) return null;

  const changes = [];
  for (let i = 1; i < prices.length; i++) {
    changes.push(prices[i] - prices[i - 1]);
  }

  let gains = changes.map(change => change > 0 ? change : 0);
  let losses = changes.map(change => change < 0 ? Math.abs(change) : 0);

  let avgGain = gains.slice(0, period).reduce((a, b) => a + b) / period;
  let avgLoss = losses.slice(0, period).reduce((a, b) => a + b) / period;

  gains = gains.slice(period);
  losses = losses.slice(period);

  gains.forEach(gain => {
    avgGain = (avgGain * (period - 1) + gain) / period;
  });

  losses.forEach(loss => {
    avgLoss = (avgLoss * (period - 1) + loss) / period;
  });

  const rs = avgGain / avgLoss;
  return 100 - (100 / (1 + rs));
}

function calculateMACD(prices, fastPeriod = 12, slowPeriod = 26, signalPeriod = 9) {
  if (!prices || prices.length < slowPeriod) return null;

  const fastEMA = calculateEMA(prices, fastPeriod);
  const slowEMA = calculateEMA(prices, slowPeriod);
  const macdLine = fastEMA.map((fast, i) => fast - slowEMA[i]);
  const signalLine = calculateEMA(macdLine, signalPeriod);
  const histogram = macdLine.map((macd, i) => macd - signalLine[i]);

  return {
    macdLine: macdLine[macdLine.length - 1],
    signalLine: signalLine[signalLine.length - 1],
    histogram: histogram[histogram.length - 1]
  };
}

function calculateEMA(prices, period) {
  const multiplier = 2 / (period + 1);
  let ema = [prices[0]];

  for (let i = 1; i < prices.length; i++) {
    ema.push((prices[i] - ema[i - 1]) * multiplier + ema[i - 1]);
  }

  return ema;
}

function calculateSMA(prices, period = 20) {
  if (!prices || prices.length < period) return null;

  const sma = [];
  for (let i = period - 1; i < prices.length; i++) {
    const sum = prices.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
    sma.push(sum / period);
  }

  return sma[sma.length - 1];
}

// Add Bollinger Bands calculation
function calculateBollingerBands(prices, period = 20, stdDev = 2) {
  if (!prices || prices.length < period) return null;

  const sma = calculateSMA(prices, period);
  const variance = prices.slice(-period).reduce((sum, price) => {
    return sum + Math.pow(price - sma, 2);
  }, 0) / period;
  const std = Math.sqrt(variance);

  return {
    middle: sma,
    upper: sma + (stdDev * std),
    lower: sma - (stdDev * std)
  };
}

// Helper function to map bond symbols to FRED series IDs
function getBondSeriesId(symbol) {
  const seriesMap = {
    '^TNX': 'DGS10', // 10-Year Treasury
    '^TYX': 'DGS30', // 30-Year Treasury
    '^FVX': 'DGS5',  // 5-Year Treasury
    // Add more mappings as needed
  };
  return seriesMap[symbol];
} 