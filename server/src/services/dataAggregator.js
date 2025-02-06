import axios from 'axios';
import { EnhancedRateLimiter } from '../utils/rateLimiter';
import { Cache } from '../utils/cache';
import { cotParser } from './cotParser';

// Initialize API clients
const apis = {
  alphavantage: axios.create({
    baseURL: 'https://www.alphavantage.co/query',
    params: { apikey: API_KEYS.ALPHA_VANTAGE }
  }),
  
  polygon: axios.create({
    baseURL: 'https://api.polygon.io/v2',
    params: { apiKey: API_KEYS.POLYGON }
  }),
  
  finnhub: axios.create({
    baseURL: 'https://finnhub.io/api/v1',
    headers: { 'X-Finnhub-Token': API_KEYS.FINNHUB }
  }),
  
  fmp: axios.create({
    baseURL: 'https://financialmodelingprep.com/api/v3',
    params: { apikey: API_KEYS.FMP }
  }),
  
  newsapi: axios.create({
    baseURL: 'https://newsapi.org/v2',
    params: { apiKey: API_KEYS.NEWS_API }
  }),
  
  fred: axios.create({
    baseURL: 'https://api.stlouisfed.org/fred',
    params: { api_key: API_KEYS.FRED }
  }),
  
  binance: axios.create({
    baseURL: 'https://api.binance.com/api/v3'
  }),
  
  coingecko: axios.create({
    baseURL: 'https://api.coingecko.com/api/v3'
  }),
  
  exchangeRate: axios.create({
    baseURL: 'https://v6.exchangerate-api.com/v6',
    params: { api_key: API_KEYS.EXCHANGE_RATE_API }
  })
};

// Initialize rate limiters and caches
const rateLimiter = new EnhancedRateLimiter();
const cache = new Cache();

export class DataAggregator {
  // Stock Market Data
  async getStockData(symbol) {
    const cacheKey = `stock:${symbol}`;
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    try {
      // Parallel requests with rate limiting
      const [quote, fundamentals, news] = await Promise.all([
        this.getQuote(symbol),
        this.getFundamentals(symbol),
        this.getNews(symbol)
      ]);

      const data = {
        quote,
        fundamentals,
        news,
        timestamp: Date.now()
      };

      cache.set(cacheKey, data);
      return data;
    } catch (error) {
      console.error('Error fetching stock data:', error);
      throw error;
    }
  }

  async getQuote(symbol) {
    await rateLimiter.throttle('POLYGON');
    const response = await apis.polygon.get(`/aggs/ticker/${symbol}/prev`);
    return response.data;
  }

  async getFundamentals(symbol) {
    await rateLimiter.throttle('FMP');
    const response = await apis.fmp.get(`/profile/${symbol}`);
    return response.data[0];
  }

  async getNews(symbol) {
    await rateLimiter.throttle('NEWS_API');
    const response = await apis.newsapi.get('/everything', {
      params: {
        q: symbol,
        sortBy: 'publishedAt',
        pageSize: 10
      }
    });
    return response.data.articles;
  }

  // Technical Analysis Data
  async getTechnicalData(symbol) {
    await rateLimiter.throttle('ALPHA_VANTAGE');
    const response = await apis.alphavantage.get('', {
      params: {
        function: 'TIME_SERIES_DAILY',
        symbol,
        outputsize: 'compact'
      }
    });
    return response.data;
  }

  // Financial Statements
  async getFinancials(symbol) {
    await rateLimiter.throttle('FMP');
    const [income, balance, cash] = await Promise.all([
      apis.fmp.get(`/income-statement/${symbol}?limit=4`),
      apis.fmp.get(`/balance-sheet-statement/${symbol}?limit=4`),
      apis.fmp.get(`/cash-flow-statement/${symbol}?limit=4`)
    ]);
    
    return {
      incomeStatement: income.data,
      balanceSheet: balance.data,
      cashFlow: cash.data
    };
  }

  // Company Profile and ESG Data
  async getCompanyProfile(symbol) {
    await rateLimiter.throttle('FINNHUB');
    const [profile, esg] = await Promise.all([
      apis.finnhub.get(`/stock/profile2?symbol=${symbol}`),
      apis.finnhub.get(`/stock/esg?symbol=${symbol}`)
    ]);
    
    return {
      profile: profile.data,
      esg: esg.data
    };
  }

  // Institutional Holdings
  async getInstitutionalHoldings(symbol) {
    await rateLimiter.throttle('FINNHUB');
    const response = await apis.finnhub.get(`/stock/institutional-ownership?symbol=${symbol}`);
    return response.data;
  }

  // SEC Filings
  async getSECFilings(symbol) {
    await rateLimiter.throttle('FMP');
    const response = await apis.fmp.get(`/sec_filings/${symbol}`);
    return response.data;
  }

  // Economic Data from FRED
  async getEconomicData(series) {
    await rateLimiter.throttle('FRED');
    const response = await apis.fred.get(`/series/observations`, {
      params: {
        series_id: series,
        sort_order: 'desc',
        limit: 1
      }
    });
    return response.data;
  }

  // Enhanced Stock Data with Multiple Sources
  async getEnhancedStockData(symbol) {
    const cacheKey = `enhanced:${symbol}`;
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    try {
      const [
        polygonData,
        alphaVantageData,
        finnhubData,
        fmpData
      ] = await Promise.all([
        this.getQuote(symbol),
        this.getTechnicalData(symbol),
        this.getCompanyProfile(symbol),
        this.getFinancials(symbol)
      ]);

      const data = {
        realtime: {
          price: polygonData.results?.[0]?.c || null,
          volume: polygonData.results?.[0]?.v || null,
          timestamp: polygonData.results?.[0]?.t || null
        },
        technical: {
          sma: this.calculateSMA(alphaVantageData),
          rsi: this.calculateRSI(alphaVantageData),
          macd: this.calculateMACD(alphaVantageData)
        },
        fundamental: {
          profile: finnhubData.profile,
          esg: finnhubData.esg,
          financials: {
            income: fmpData.incomeStatement?.[0],
            balance: fmpData.balanceSheet?.[0],
            cashflow: fmpData.cashFlow?.[0]
          }
        },
        timestamp: Date.now()
      };

      cache.set(cacheKey, data, 60000); // 1 minute cache
      return data;
    } catch (error) {
      console.error('Error fetching enhanced stock data:', error);
      throw error;
    }
  }

  // Technical Analysis Calculations
  calculateSMA(data, period = 20) {
    // Implementation
  }

  calculateRSI(data, period = 14) {
    // Implementation
  }

  calculateMACD(data) {
    // Implementation
  }

  // Market Sentiment Analysis
  async getMarketSentiment(symbol) {
    await rateLimiter.throttle('FINNHUB');
    const [news, social, insider] = await Promise.all([
      this.getNews(symbol),
      apis.finnhub.get(`/stock/social-sentiment?symbol=${symbol}`),
      apis.finnhub.get(`/stock/insider-sentiment?symbol=${symbol}`)
    ]);

    return {
      news: this.analyzeSentiment(news),
      social: social.data,
      insider: insider.data
    };
  }

  // Sector & Industry Analysis
  async getSectorData(symbol) {
    await rateLimiter.throttle('FMP');
    const [sector, peers] = await Promise.all([
      apis.fmp.get(`/stock-screener`),
      apis.finnhub.get(`/stock/peers?symbol=${symbol}`)
    ]);

    return {
      sector: sector.data,
      peers: peers.data
    };
  }

  // Crypto Methods
  async getCryptoQuote(symbol) {
    const response = await apis.binance.get('/ticker/24hr', {
      params: { symbol: symbol.replace('-', '') }
    });
    
    return {
      lastPrice: parseFloat(response.data.lastPrice),
      priceChange: parseFloat(response.data.priceChange),
      priceChangePercent: parseFloat(response.data.priceChangePercent),
      volume: parseFloat(response.data.volume),
      quoteVolume: parseFloat(response.data.quoteVolume),
      highPrice: parseFloat(response.data.highPrice),
      lowPrice: parseFloat(response.data.lowPrice),
      weightedAvgPrice: parseFloat(response.data.weightedAvgPrice)
    };
  }

  async getCryptoDepth(symbol) {
    const response = await apis.binance.get('/depth', {
      params: { 
        symbol: symbol.replace('-', ''),
        limit: 100
      }
    });
    
    return {
      bids: response.data.bids.map(([price, qty]) => [parseFloat(price), parseFloat(qty)]),
      asks: response.data.asks.map(([price, qty]) => [parseFloat(price), parseFloat(qty)])
    };
  }

  async getCryptoTrades(symbol) {
    const response = await apis.binance.get('/trades', {
      params: {
        symbol: symbol.replace('-', ''),
        limit: 50
      }
    });
    
    const trades = response.data.map(t => ({
      time: t.time,
      price: parseFloat(t.price),
      qty: parseFloat(t.qty),
      isBuyerMaker: t.isBuyerMaker
    }));

    return {
      trades,
      avgPrice: trades.reduce((sum, t) => sum + t.price, 0) / trades.length,
      totalVolume: trades.reduce((sum, t) => sum + t.qty, 0),
      buyVolume: trades.filter(t => !t.isBuyerMaker).reduce((sum, t) => sum + t.qty, 0),
      sellVolume: trades.filter(t => t.isBuyerMaker).reduce((sum, t) => sum + t.qty, 0)
    };
  }

  async getCryptoMarket(symbol) {
    const response = await apis.coingecko.get(`/coins/${symbol.split('-')[0].toLowerCase()}`, {
      params: {
        localization: false,
        tickers: true,
        market_data: true
      }
    });
    
    return {
      circulatingSupply: response.data.market_data.circulating_supply,
      totalSupply: response.data.market_data.total_supply,
      maxSupply: response.data.market_data.max_supply,
      marketCap: response.data.market_data.market_cap.usd,
      marketCapRank: response.data.market_cap_rank,
      totalVolume: response.data.market_data.total_volume.usd,
      numberOfMarkets: response.data.tickers.length,
      numberOfExchanges: new Set(response.data.tickers.map(t => t.market.name)).size
    };
  }

  // Forex Methods
  async getForexData(baseCurrency, quoteCurrency) {
    await rateLimiter.throttle('EXCHANGE_RATE');
    const response = await apis.exchangeRate.get(`/${API_KEYS.EXCHANGE_RATE_API}/pair/${baseCurrency}/${quoteCurrency}`);
    
    return {
      rate: response.data.conversion_rate,
      time: response.data.time_last_update_unix,
      nextUpdate: response.data.time_next_update_unix
    };
  }

  // For options data, we'll use alternative free sources
  async getOptionsData(symbol) {
    // Use Yahoo Finance API through RapidAPI (part of ALPHA_VANTAGE subscription)
    await rateLimiter.throttle('ALPHA_VANTAGE');
    const response = await apis.alphavantage.get('', {
      params: {
        function: 'OPTIONS',
        symbol,
        strike: 'all'
      }
    });
    
    return response.data;
  }

  async getForexRate(symbol) {
    const [base, quote] = symbol.split('/');
    const response = await apis.exchangeRate.get(`/${API_KEYS.EXCHANGE_RATE_API}/pair/${base}/${quote}`);
    
    return {
      symbol,
      rate: response.data.conversion_rate,
      change: response.data.rate_change,
      changePercent: response.data.rate_change_pct,
      timestamp: response.data.time_last_update_unix * 1000,
      dayHigh: response.data.day_high,
      dayLow: response.data.day_low,
      dayOpen: response.data.day_open
    };
  }

  async getForexEconomics(base, quote) {
    const [baseData, quoteData] = await Promise.all([
      this.getCountryEconomics(base),
      this.getCountryEconomics(quote)
    ]);
    
    return {
      base: baseData,
      quote: quoteData
    };
  }

  async getCountryEconomics(country) {
    const seriesMap = {
      GDP: `${country}_GDP`,
      CPI: `${country}_CPI`,
      UNEMP: `${country}_UNEMP`,
      RATE: `${country}_RATE`
    };

    const responses = await Promise.all(
      Object.values(seriesMap).map(series => 
        apis.fred.get('/series/observations', {
          params: {
            series_id: series,
            sort_order: 'desc',
            limit: 1
          }
        })
      )
    );

    return {
      gdpGrowth: parseFloat(responses[0].data.observations[0].value),
      inflation: parseFloat(responses[1].data.observations[0].value),
      unemployment: parseFloat(responses[2].data.observations[0].value),
      interestRate: parseFloat(responses[3].data.observations[0].value)
    };
  }

  async getForexFlows(symbol) {
    const response = await apis.exchangeRate.get(`/${API_KEYS.EXCHANGE_RATE_API}/history/${symbol}`);
    const history = response.data.history;
    
    return {
      dayHigh: Math.max(...history.slice(0, 1).map(h => h.rate)),
      dayLow: Math.min(...history.slice(0, 1).map(h => h.rate)),
      dayRange: (history[0].high - history[0].low) / history[0].low,
      weekChange: (history[0].rate - history[7].rate) / history[7].rate,
      monthChange: (history[0].rate - history[30].rate) / history[30].rate,
      yearChange: (history[0].rate - history[365].rate) / history[365].rate
    };
  }

  // CFTC Commitments of Traders (COT) Data
  async getCOTData(symbol) {
    try {
      const data = await cotParser.fetchCOTData(symbol);
      
      // Cache the data since COT reports are weekly
      const cacheKey = `COT:${symbol}`;
      cache.set(cacheKey, data, 24 * 60 * 60 * 1000); // 24 hour cache
      
      return {
        reportDate: data.reportDate,
        
        // Commercial positions
        commercialLong: data.commercialLong,
        commercialShort: data.commercialShort,
        commercialNet: data.commercialNet,
        
        // Non-Commercial positions
        nonCommercialLong: data.nonCommercialLong,
        nonCommercialShort: data.nonCommercialShort,
        nonCommercialNet: data.nonCommercialNet,
        
        // Changes
        commercialNetChange: data.commercialNetChange,
        nonCommercialNetChange: data.nonCommercialNetChange,
        
        // Additional analysis
        commercialPositioning: this.analyzePositioning(data.commercialNet),
        nonCommercialPositioning: this.analyzePositioning(data.nonCommercialNet),
        marketSentiment: this.analyzeSentiment(data.nonCommercialNet, data.totalOpenInterest)
      };
    } catch (error) {
      console.error('Error in getCOTData:', error);
      
      // Try to return cached data if available
      const cachedData = cache.get(`COT:${symbol}`);
      if (cachedData) {
        return {
          ...cachedData,
          cached: true,
          asOf: cachedData.reportDate
        };
      }
      
      throw new Error('Unable to fetch COT data');
    }
  }

  // Helper methods for COT analysis
  analyzePositioning(netPosition) {
    if (netPosition > 0) {
      return netPosition > 50000 ? 'STRONGLY LONG' : 'MODERATELY LONG';
    } else {
      return netPosition < -50000 ? 'STRONGLY SHORT' : 'MODERATELY SHORT';
    }
  }

  analyzeSentiment(nonCommercialNet, totalOI) {
    const netPositionPercent = (nonCommercialNet / totalOI) * 100;
    if (netPositionPercent > 20) return 'BULLISH';
    if (netPositionPercent < -20) return 'BEARISH';
    return 'NEUTRAL';
  }
}

export const dataAggregator = new DataAggregator(); 