const yahooFinance = require('yahoo-finance2').default;
const finnhub = require('finnhub');
const axios = require('axios');
const SECURITY_TYPES = require('../constants/securityTypes');

class YahooFinanceService {
  constructor() {
    // Configure Yahoo Finance with correct options
    yahooFinance.setGlobalConfig({
      queue: {
        concurrency: 1,
        timeout: 10000
      }
    });

    // Initialize Finnhub client
    this.finnhubClient = new finnhub.DefaultApi();
    this.finnhubClient.apiKey = process.env.FINNHUB_API_KEY;

    // Initialize futures symbol mapping
    this.futuresMap = {
      'ES': 'ES=F',  // S&P 500 futures
      'NQ': 'NQ=F',  // Nasdaq futures
      'CL': 'CL=F',  // Crude Oil futures
      'GC': 'GC=F',  // Gold futures
      'SI': 'SI=F',  // Silver futures
      'HG': 'HG=F',  // Copper futures
      '6E': '6E=F',  // Euro futures
      '6J': '6J=F',  // Japanese Yen futures
      'ZC': 'ZC=F',  // Corn futures
      'ZS': 'ZS=F',  // Soybean futures
      'ZW': 'ZW=F',  // Wheat futures
      'KC': 'KC=F',  // Coffee futures
      'CT': 'CT=F',  // Cotton futures
      'NG': 'NG=F',  // Natural Gas futures
      'RB': 'RB=F',  // RBOB Gasoline futures
      'HO': 'HO=F',  // Heating Oil futures
      'PA': 'PA=F',  // Palladium futures
      'PL': 'PL=F',  // Platinum futures
      'CC': 'CC=F',  // Cocoa futures
      'SB': 'SB=F',  // Sugar futures
      'RTY': 'RTY=F',  // Russell 2000 futures
      'YM': 'YM=F',    // Dow futures
      'ZB': 'ZB=F',    // 30-Year T-Bond futures
      'ZN': 'ZN=F',    // 10-Year T-Note futures
      'ZF': 'ZF=F',    // 5-Year T-Note futures
      'ZT': 'ZT=F',    // 2-Year T-Note futures
      'VIX': '/VX',    // VIX futures (CBOE symbol)
      'VX': '/VX'      // VIX futures alternate symbol
    };
  }

  getYahooSymbol(symbol, type) {
    switch (type) {
      case 'FOREX':
        return `${symbol}=X`;
      case 'CRYPTO':
        return `${symbol}-USD`;
      case 'INDEX':
        return `^${symbol}`;
      case 'FUTURES':
        return this.futuresMap[symbol] || symbol;
      default:
        return symbol;
    }
  }

  async getQuote(symbol, type) {
    try {
      // Handle futures symbols
      if (type === 'FUTURES') {
        const futuresSymbol = this.futuresMap[symbol] || symbol;
        symbol = futuresSymbol;
      }

      console.log(`Getting quote for ${symbol} (${type})`);
      const yahooSymbol = this.getYahooSymbol(symbol, type);
      
      try {
        const quote = await yahooFinance.quote(yahooSymbol);
        if (!quote) {
          throw new Error(`No quote data available for ${symbol}`);
        }

        // Format quote data consistently
        return {
          symbol: quote.symbol,
          name: quote.shortName || quote.longName || `${symbol} Futures`,
          price: {
            current: quote.regularMarketPrice || null,
            change: quote.regularMarketChange || null,
            changePercent: quote.regularMarketChangePercent || null,
            open: quote.regularMarketOpen || null,
            high: quote.regularMarketDayHigh || null,
            low: quote.regularMarketDayLow || null,
            previousClose: quote.regularMarketPreviousClose || null,
            volume: quote.regularMarketVolume || null
          },
          trading: {
            bid: quote.bid || null,
            ask: quote.ask || null,
            bidSize: quote.bidSize || null,
            askSize: quote.askSize || null
          },
          market: {
            cap: quote.marketCap || null,
            pe: quote.forwardPE || null,
            eps: quote.epsForward || null,
            beta: quote.beta || null,
            dividendYield: quote.dividendYield || null
          },
          ranges: {
            dayRange: quote.regularMarketDayRange || `${quote.regularMarketDayLow}-${quote.regularMarketDayHigh}`,
            fiftyTwoWeekRange: quote.fiftyTwoWeekRange || `${quote.fiftyTwoWeekLow}-${quote.fiftyTwoWeekHigh}`,
            fiftyDayAvg: quote.fiftyDayAverage || null,
            twoHundredDayAvg: quote.twoHundredDayAverage || null
          }
        };
      } catch (error) {
        if (error.message.includes('validation')) {
          console.warn(`[Quote] Validation error for ${symbol}, attempting fallback...`);
          // Return minimal quote data with null values
          return {
            symbol: symbol,
            name: `${symbol} Futures`,
            price: {
              current: null,
              change: null,
              changePercent: null,
              open: null,
              high: null,
              low: null,
              previousClose: null,
              volume: null
            },
            trading: {
              bid: null,
              ask: null,
              bidSize: null,
              askSize: null
            },
            market: {},
            ranges: {}
          };
        }
        throw error;
      }
    } catch (error) {
      console.error('Quote error:', error);
      throw new Error(`Failed to get quote for ${symbol}: ${error.message}`);
    }
  }

  async getFinancialAnalysis(symbol, type) {
    const yahooSymbol = this.getYahooSymbol(symbol, type);
    const modules = ['summaryDetail', 'defaultKeyStatistics', 'financialData'];
    
    if (type === 'ETF') {
      modules.push('fundProfile', 'topHoldings');
    }
    
    const data = await yahooFinance.quoteSummary(yahooSymbol, { modules });
    return this.formatFA(data, type);
  }

  async getMarketData(symbol, type) {
    const yahooSymbol = this.getYahooSymbol(symbol, type);
    const data = await yahooFinance.quoteSummary(yahooSymbol, {
      modules: ['price', 'summaryDetail']
    });
    return this.formatMarketData(data, type);
  }

  async getTechnicalAnalysis(symbol, type) {
    try {
      console.log(`[Tech] Getting data for ${symbol} (${type})`);
      const yahooSymbol = this.getYahooSymbol(symbol, type);
      
      // Get historical data for technical analysis
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 200); // 200 days of data
      
      const historicalData = await yahooFinance.historical(yahooSymbol, {
        period1: startDate,
        period2: endDate,
        interval: '1d'
      });
      
      if (!historicalData || historicalData.length === 0) {
        throw new Error(`No historical data available for ${symbol}`);
      }
      
      const prices = historicalData.map(d => d.close);
      const volumes = historicalData.map(d => d.volume);
      
      // Ensure we have valid volume data
      if (!volumes.some(v => v !== null && !isNaN(v))) {
        console.warn(`[Tech] No valid volume data for ${symbol}`);
        return {
          rsi: this.calculateRSI(prices),
          macd: this.calculateMACD(prices),
          bollinger: this.calculateBollingerBands(prices),
          sma20: this.calculateSMA(prices, 20),
          sma50: this.calculateSMA(prices, 50),
          sma200: this.calculateSMA(prices, 200)
        };
      }
      
      const validVolumes = volumes.filter(v => v !== null && !isNaN(v));
      const lastValidVolumes = validVolumes.slice(-5);
      const volumeMetrics = this.calculateVolumeMetrics(validVolumes);
      
      return {
        rsi: this.calculateRSI(prices),
        macd: this.calculateMACD(prices),
        bollinger: this.calculateBollingerBands(prices),
        sma20: this.calculateSMA(prices, 20),
        sma50: this.calculateSMA(prices, 50),
        sma200: this.calculateSMA(prices, 200),
        volume: volumes[volumes.length - 1],
        avgVolume: this.calculateSMA(validVolumes, 20),
        volumes: lastValidVolumes,
        volumeChange: lastValidVolumes.length >= 2 ? 
          ((lastValidVolumes[lastValidVolumes.length-1] / lastValidVolumes[lastValidVolumes.length-2]) - 1) * 100 : null,
        volumeProfile: volumeMetrics
      };
    } catch (error) {
      console.error(`[Tech] Error:`, error);
      throw error;
    }
  }

  static async getFinnhubQuote(symbol) {
    try {
      const quote = await this.finnhubClient.quote(symbol);
      return quote;
    } catch (error) {
      console.warn('Finnhub quote error:', error);
      return null;
    }
  }

  formatQuote(quote, type) {
    const baseQuote = {
      price: quote.regularMarketPrice,
      change: quote.regularMarketChange,
      changePercent: quote.regularMarketChangePercent,
      volume: quote.regularMarketVolume,
      high: quote.regularMarketDayHigh,
      low: quote.regularMarketDayLow,
      open: quote.regularMarketOpen,
      previousClose: quote.regularMarketPreviousClose,
      timestamp: quote.regularMarketTime,
      currency: quote.currency
    };

    switch (type) {
      case 'STOCK':
      case 'ETF':
        return {
          ...baseQuote,
          bid: quote.bid,
          bidSize: quote.bidSize,
          ask: quote.ask,
          askSize: quote.askSize,
          dayRange: `${quote.regularMarketDayLow}-${quote.regularMarketDayHigh}`,
          yearRange: `${quote.fiftyTwoWeekLow}-${quote.fiftyTwoWeekHigh}`,
          preMarket: quote.preMarketPrice,
          postMarket: quote.postMarketPrice
        };

      case 'FOREX':
        return {
          ...baseQuote,
          bid: quote.bid,
          ask: quote.ask,
          spread: quote.ask - quote.bid,
          dayRange: `${quote.regularMarketDayLow}-${quote.regularMarketDayHigh}`
        };

      case 'CRYPTO':
        return {
          ...baseQuote,
          marketCap: quote.marketCap,
          circulatingSupply: quote.circulatingSupply,
          volume24Hr: quote.volume24Hr
        };

      case 'INDEX':
        return {
          ...baseQuote,
          components: quote.components,
          dayRange: `${quote.regularMarketDayLow}-${quote.regularMarketDayHigh}`
        };

      default:
        return baseQuote;
    }
  }

  formatFA(data, type) {
    const { summaryDetail, defaultKeyStatistics, financialData } = data;

    switch (type) {
      case 'STOCK':
        return {
          valuation: {
            marketCap: summaryDetail?.marketCap,
            enterpriseValue: defaultKeyStatistics?.enterpriseValue,
            peRatio: summaryDetail?.forwardPE,
            pegRatio: defaultKeyStatistics?.pegRatio,
            priceToBook: defaultKeyStatistics?.priceToBook
          },
          financials: {
            revenue: financialData?.totalRevenue,
            revenueGrowth: financialData?.revenueGrowth,
            grossMargin: financialData?.grossMargins,
            operatingMargin: financialData?.operatingMargins,
            profitMargin: financialData?.profitMargins,
            freeCashFlow: financialData?.freeCashflow
          },
          metrics: {
            eps: defaultKeyStatistics?.forwardEps,
            epsGrowth: defaultKeyStatistics?.earningsGrowth,
            returnOnEquity: financialData?.returnOnEquity,
            returnOnAssets: financialData?.returnOnAssets,
            debtToEquity: financialData?.debtToEquity
          }
        };

      case 'ETF':
        return {
          fundInfo: {
            expenseRatio: defaultKeyStatistics?.expenseRatio,
            category: defaultKeyStatistics?.category,
            totalAssets: summaryDetail?.totalAssets,
            yield: summaryDetail?.yield,
            beta: defaultKeyStatistics?.beta,
            priceToBook: defaultKeyStatistics?.priceToBook
          },
          performance: {
            ytdReturn: defaultKeyStatistics?.ytdReturn,
            threeYearReturn: defaultKeyStatistics?.threeYearAverageReturn,
            fiveYearReturn: defaultKeyStatistics?.fiveYearAverageReturn,
            priceToEarnings: summaryDetail?.forwardPE
          },
          holdings: data.topHoldings?.holdings || []
        };

      case 'FOREX':
        return {
          rates: {
            bid: summaryDetail?.bid,
            ask: summaryDetail?.ask,
            spread: summaryDetail?.ask - summaryDetail?.bid,
            dayRange: `${summaryDetail?.dayLow}-${summaryDetail?.dayHigh}`,
            yearRange: `${summaryDetail?.fiftyTwoWeekLow}-${summaryDetail?.fiftyTwoWeekHigh}`
          }
        };

      case 'CRYPTO':
        return {
          marketMetrics: {
            marketCap: summaryDetail?.marketCap,
            circulatingSupply: defaultKeyStatistics?.circulatingSupply,
            maxSupply: defaultKeyStatistics?.maxSupply,
            volume24Hr: summaryDetail?.volume24Hr,
            volumeAllCurrencies: summaryDetail?.volumeAllCurrencies
          }
        };

      default:
        return {};
    }
  }

  formatMarketData(data, type) {
    const { price, summaryDetail } = data;

    const baseMarketData = {
      marketCap: price?.marketCap,
      volume: price?.regularMarketVolume,
      avgVolume: summaryDetail?.averageVolume,
      beta: summaryDetail?.beta,
      fiftyTwoWeekHigh: summaryDetail?.fiftyTwoWeekHigh,
      fiftyTwoWeekLow: summaryDetail?.fiftyTwoWeekLow
    };

    switch (type) {
      case 'STOCK':
      case 'ETF':
        return {
          ...baseMarketData,
          sharesOutstanding: price?.sharesOutstanding,
          floatShares: defaultKeyStatistics?.floatShares,
          shortRatio: defaultKeyStatistics?.shortRatio,
          shortPercentOfFloat: defaultKeyStatistics?.shortPercentOfFloat
        };

      case 'CRYPTO':
        return {
          ...baseMarketData,
          circulatingSupply: price?.circulatingSupply,
          maxSupply: price?.maxSupply,
          volume24Hr: summaryDetail?.volume24Hr
        };

      default:
        return baseMarketData;
    }
  }

  calculateRSI(prices, period = 14) {
    let gains = 0;
    let losses = 0;
    
    for (let i = 1; i < period + 1; i++) {
      const difference = prices[i] - prices[i - 1];
      if (difference >= 0) {
        gains += difference;
      } else {
        losses -= difference;
      }
    }

    let avgGain = gains / period;
    let avgLoss = losses / period;
    
    for (let i = period + 1; i < prices.length; i++) {
      const difference = prices[i] - prices[i - 1];
      if (difference >= 0) {
        avgGain = (avgGain * 13 + difference) / period;
        avgLoss = (avgLoss * 13) / period;
      } else {
        avgGain = (avgGain * 13) / period;
        avgLoss = (avgLoss * 13 - difference) / period;
      }
    }
    
    const rs = avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
  }

  calculateMACD(prices) {
    const ema12 = this.calculateEMA(prices, 12);
    const ema26 = this.calculateEMA(prices, 26);
    const macdLine = ema12 - ema26;
    const signalLine = this.calculateEMA([...Array(26).fill(0), macdLine], 9);
    
    return {
      macd: macdLine,
      signal: signalLine,
      histogram: macdLine - signalLine
    };
  }

  calculateBollingerBands(prices, period = 20) {
    const sma = this.calculateSMA(prices, period);
    const stdDev = this.calculateStandardDeviation(prices, period);
    
    return {
      middle: sma,
      upper: sma + (2 * stdDev),
      lower: sma - (2 * stdDev)
    };
  }

  calculateSMA(data, period) {
    const index = data.length - 1;
    const values = data.slice(Math.max(0, index - period + 1), index + 1);
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    return avg;
  }

  calculateEMA(prices, period) {
    const multiplier = 2 / (period + 1);
    let ema = prices[0];
    
    for (let i = 1; i < prices.length; i++) {
      ema = (prices[i] - ema) * multiplier + ema;
    }
    
    return ema;
  }

  calculateStandardDeviation(prices, period) {
    const index = prices.length - 1;
    const values = prices.slice(Math.max(0, index - period + 1), index + 1);
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    const squareDiffs = values.map(value => Math.pow(value - avg, 2));
    const avgSquareDiff = squareDiffs.reduce((a, b) => a + b, 0) / squareDiffs.length;
    return Math.sqrt(avgSquareDiff);
  }

  calculateVolumeTrend(volumes) {
    if (volumes.length < 2) return 'N/A';
    const change = (volumes[volumes.length - 1] - volumes[volumes.length - 2]) / volumes[volumes.length - 2];
    return change > 0 ? 'Up' : 'Down';
  }

  calculateMedian(volumes) {
    const sortedVolumes = volumes.slice().sort((a, b) => a - b);
    const mid = Math.floor(sortedVolumes.length / 2);
    return sortedVolumes.length % 2 === 0 ? (sortedVolumes[mid - 1] + sortedVolumes[mid]) / 2 : sortedVolumes[mid];
  }

  calculateVolumeMetrics(volumes) {
    const validVolumes = volumes.filter(v => v !== null && !isNaN(v));
    if (validVolumes.length < 2) return null;

    const avg = this.calculateSMA(validVolumes, validVolumes.length);
    const median = this.calculateMedian(validVolumes);
    const max = Math.max(...validVolumes);
    const min = Math.min(...validVolumes);
    const current = validVolumes[validVolumes.length - 1];
    
    // Calculate relative volumes
    const vol5d = this.calculateSMA(validVolumes.slice(-5), 5);
    const vol20d = this.calculateSMA(validVolumes.slice(-20), 20);
    
    // Calculate trend strength
    const trendStrength = this.calculateTrendStrength(validVolumes.slice(-5));
    
    return {
      max,
      min,
      median,
      volatility: Math.min(((max - min) / median) * 100, 1000),
      strength: ((current || 0) / avg) * 100,
      trend: this.calculateVolumeTrend(validVolumes),
      consistency: this.calculateVolumeConsistency(validVolumes),
      relativeVolume: {
        '5d': vol5d ? (current / vol5d) * 100 : null,
        '20d': vol20d ? (current / vol20d) * 100 : null
      },
      trendStrength
    };
  }

  calculateTrendStrength(volumes) {
    if (volumes.length < 3) return null;
    
    let increases = 0;
    let decreases = 0;
    
    for (let i = 1; i < volumes.length; i++) {
      if (volumes[i] > volumes[i-1]) increases++;
      else if (volumes[i] < volumes[i-1]) decreases++;
    }
    
    const total = increases + decreases;
    if (total === 0) return 'Flat';
    
    const ratio = increases / total;
    if (ratio > 0.8) return 'Very Strong Up';
    if (ratio > 0.6) return 'Strong Up';
    if (ratio > 0.4) return 'Neutral';
    if (ratio > 0.2) return 'Strong Down';
    return 'Very Strong Down';
  }

  calculateVolumeConsistency(volumes) {
    if (volumes.length < 3) return 'N/A';
    const increases = volumes.slice(1).filter((v, i) => v > volumes[i]).length;
    const ratio = increases / (volumes.length - 1);
    if (ratio > 0.7) return 'Strong Up';
    if (ratio > 0.5) return 'Moderate Up';
    if (ratio < 0.3) return 'Strong Down';
    if (ratio < 0.5) return 'Moderate Down';
    return 'Neutral';
  }
}

module.exports = new YahooFinanceService(); 