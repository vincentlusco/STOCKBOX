const yahooFinance = require('yahoo-finance2');
const finnhub = require('finnhub');
const Oanda = require('@oanda/v20');
const AlphaVantage = require('alphavantage')({ key: process.env.ALPHA_VANTAGE_KEY });
const IEXCloud = require('@iexcloud/iexjs').default;
const NodeCache = require('node-cache');

class DataProviders {
  constructor() {
    // Initialize cache with 30 second standard TTL
    this.cache = new NodeCache({ 
      stdTTL: 30,
      checkperiod: 60,
      useClones: false
    });

    // Initialize providers
    this.finnhubClient = new finnhub.DefaultApi();
    this.finnhubClient.apiKey = process.env.FINNHUB_API_KEY;

    this.oandaClient = new Oanda({
      token: process.env.OANDA_API_KEY,
      practice: true
    });

    this.iex = new IEXCloud({ token: process.env.IEX_TOKEN });
    this.yahoo = yahooFinance;
    this.alpha = AlphaVantage;

    // Sample data for testing
    this.sampleData = {
      STOCK: {
        quote: {
          price: 150.25,
          change: 2.50,
          changePercent: 1.69,
          volume: '55.2M',
          high: 151.20,
          low: 149.80,
          open: 149.90
        },
        financials: {
          peRatio: 25.6,
          eps: 6.15,
          revenueGrowth: 15.2,
          profitMargin: 28.5
        },
        market: {
          marketCap: '2.5T',
          float: '16.2B',
          beta: 1.15
        }
      },
      FOREX: {
        quote: {
          price: 1.2150,
          change: 0.0025,
          changePercent: 0.21,
          volume: '125.2B',
          high: 1.2180,
          low: 1.2120
        },
        financials: {
          interestRate: 4.5,
          forwardPoints: -15,
          swapRate: -2.5
        },
        market: {
          volume24h: '125.2B',
          volatility: 8.5
        }
      },
      CRYPTO: {
        quote: {
          price: 42150,
          change: 1250,
          changePercent: 3.05,
          volume: '28.5B',
          high: 42500,
          low: 41800
        },
        financials: {
          marketDominance: 45.2,
          hashRate: '425 EH/s',
          networkDifficulty: '72.35T'
        },
        market: {
          marketCap: '825.4B',
          volume24h: '28.5B',
          circulatingSupply: '19.45M'
        }
      }
    };
  }

  async getYahooData(symbol) {
    const cacheKey = `yahoo_${symbol}`;
    const cached = this.cache.get(cacheKey);
    if (cached) return cached;

    try {
      const [quote, stats, profile] = await Promise.all([
        this.yahoo.quote(symbol),
        this.yahoo.quoteSummary(symbol, { modules: ['defaultKeyStatistics', 'financialData'] }),
        this.yahoo.quoteSummary(symbol, { modules: ['assetProfile', 'summaryProfile'] })
      ]);

      const data = {
        quote,
        stats: stats.defaultKeyStatistics,
        financials: stats.financialData,
        profile: { ...profile.assetProfile, ...profile.summaryProfile }
      };

      this.cache.set(cacheKey, data);
      return data;
    } catch (error) {
      console.error('Yahoo Finance error:', error);
      return null;
    }
  }

  async getFinnhubData(symbol) {
    const cacheKey = `finnhub_${symbol}`;
    const cached = this.cache.get(cacheKey);
    if (cached) return cached;

    try {
      const [quote, profile, metrics, earnings] = await Promise.all([
        new Promise((resolve) => this.finnhubClient.quote(symbol, (error, data) => resolve(error ? null : data))),
        new Promise((resolve) => this.finnhubClient.companyProfile2({ symbol }, (error, data) => resolve(error ? null : data))),
        new Promise((resolve) => this.finnhubClient.companyBasicFinancials(symbol, 'all', (error, data) => resolve(error ? null : data))),
        new Promise((resolve) => this.finnhubClient.companyEarnings(symbol, (error, data) => resolve(error ? null : data)))
      ]);

      const data = { quote, profile, metrics, earnings };
      this.cache.set(cacheKey, data);
      return data;
    } catch (error) {
      console.error('Finnhub error:', error);
      return null;
    }
  }

  async getAlphaVantageData(symbol) {
    const cacheKey = `alpha_${symbol}`;
    const cached = this.cache.get(cacheKey);
    if (cached) return cached;

    try {
      const [overview, income, balance, cashflow] = await Promise.all([
        this.alpha.fundamental.company_overview(symbol),
        this.alpha.fundamental.income_statement(symbol),
        this.alpha.fundamental.balance_sheet(symbol),
        this.alpha.fundamental.cash_flow(symbol)
      ]);

      const data = { overview, income, balance, cashflow };
      this.cache.set(cacheKey, data);
      return data;
    } catch (error) {
      console.error('Alpha Vantage error:', error);
      return null;
    }
  }

  async getIEXData(symbol) {
    const cacheKey = `iex_${symbol}`;
    const cached = this.cache.get(cacheKey);
    if (cached) return cached;

    try {
      const [advanced, fundamentals, technicals] = await Promise.all([
        this.iex.stock(symbol).advancedStats(),
        this.iex.stock(symbol).fundamentals(),
        this.iex.stock(symbol).technicals()
      ]);

      const data = { advanced, fundamentals, technicals };
      this.cache.set(cacheKey, data);
      return data;
    } catch (error) {
      console.error('IEX error:', error);
      return null;
    }
  }

  clearCache(symbol) {
    if (symbol) {
      // Clear specific symbol data
      const keys = [
        `yahoo_${symbol}`,
        `finnhub_${symbol}`,
        `alpha_${symbol}`,
        `iex_${symbol}`
      ];
      keys.forEach(key => this.cache.del(key));
    } else {
      // Clear all cache
      this.cache.flushAll();
    }
  }

  // Enhanced data methods
  async getFullStockData(symbol) {
    try {
      const [yahoo, finnhub, alpha, iex] = await Promise.all([
        this.getYahooData(symbol),
        this.getFinnhubData(symbol),
        this.getAlphaVantageData(symbol),
        this.getIEXData(symbol)
      ]);

      return {
        quote: {
          price: yahoo?.quote?.regularMarketPrice || finnhub?.quote?.c,
          change: yahoo?.quote?.regularMarketChange || finnhub?.quote?.d,
          changePercent: yahoo?.quote?.regularMarketChangePercent || finnhub?.quote?.dp,
          volume: yahoo?.quote?.regularMarketVolume || finnhub?.quote?.v,
          high: yahoo?.quote?.regularMarketHigh || finnhub?.quote?.h,
          low: yahoo?.quote?.regularMarketLow || finnhub?.quote?.l,
          open: yahoo?.quote?.regularMarketOpen || finnhub?.quote?.o,
          previousClose: yahoo?.quote?.regularMarketPreviousClose
        },
        fundamentals: {
          // Financial ratios
          peRatio: yahoo?.stats?.forwardPE || alpha?.overview?.PERatio,
          pegRatio: yahoo?.stats?.pegRatio || alpha?.overview?.PEGRatio,
          priceToBook: yahoo?.stats?.priceToBook || alpha?.overview?.PriceToBookRatio,
          priceToSales: yahoo?.stats?.priceToSalesTrailing12Months,
          enterpriseValue: yahoo?.stats?.enterpriseValue,
          enterpriseToRevenue: yahoo?.stats?.enterpriseToRevenue,
          enterpriseToEbitda: yahoo?.stats?.enterpriseToEbitda,

          // Earnings
          eps: yahoo?.stats?.trailingEps || alpha?.overview?.EPS,
          epsGrowth: finnhub?.metrics?.metric?.epsGrowth,
          nextEarningsDate: yahoo?.quote?.earningsTimestamp,

          // Growth metrics
          revenueGrowth: finnhub?.metrics?.metric?.revenueGrowth,
          profitMargin: yahoo?.financials?.profitMargins,
          operatingMargin: yahoo?.financials?.operatingMargins,
          grossMargin: yahoo?.financials?.grossMargins
        },
        marketData: {
          marketCap: yahoo?.quote?.marketCap || alpha?.overview?.MarketCapitalization,
          sharesOutstanding: yahoo?.stats?.sharesOutstanding,
          floatShares: finnhub?.metrics?.metric?.shareFloat,
          shortRatio: yahoo?.stats?.shortRatio,
          shortPercentOfFloat: yahoo?.stats?.shortPercentOfFloat,
          beta: yahoo?.stats?.beta || alpha?.overview?.Beta,
          institutionalOwnership: finnhub?.metrics?.metric?.institutionalOwnership,
          insiderOwnership: finnhub?.metrics?.metric?.insiderOwnership
        },
        technicals: {
          ...iex?.technicals,
          fiftyDayAverage: yahoo?.quote?.fiftyDayAverage,
          twoHundredDayAverage: yahoo?.quote?.twoHundredDayAverage,
          fiftyTwoWeekHigh: yahoo?.quote?.fiftyTwoWeekHigh,
          fiftyTwoWeekLow: yahoo?.quote?.fiftyTwoWeekLow
        },
        profile: {
          name: yahoo?.quote?.longName || alpha?.overview?.Name,
          sector: yahoo?.profile?.sector || alpha?.overview?.Sector,
          industry: yahoo?.profile?.industry || alpha?.overview?.Industry,
          website: yahoo?.profile?.website || alpha?.overview?.Website,
          description: yahoo?.profile?.longBusinessSummary || alpha?.overview?.Description,
          employees: yahoo?.profile?.fullTimeEmployees || alpha?.overview?.FullTimeEmployees,
          country: yahoo?.profile?.country || alpha?.overview?.Country,
          exchange: yahoo?.quote?.exchange || alpha?.overview?.Exchange
        }
      };
    } catch (error) {
      console.error('Full stock data error:', error);
      throw error;
    }
  }

  async getStockData(symbol) {
    return this.sampleData.STOCK;
  }

  async getForexData(symbol) {
    return this.sampleData.FOREX;
  }

  async getCryptoData(symbol) {
    return this.sampleData.CRYPTO;
  }

  async getFinancialData(symbol, type) {
    return this.sampleData[type]?.financials || {};
  }

  async getMarketData(symbol, type) {
    return this.sampleData[type]?.market || {};
  }

  // ... Additional methods for other security types
}

module.exports = new DataProviders(); 