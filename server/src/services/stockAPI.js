import axios from 'axios';
import { config } from '../config';

// Create API instances with proper configurations
const alphaVantage = axios.create({
  baseURL: 'https://www.alphavantage.co/query',
  params: {
    apikey: config.ALPHA_VANTAGE_KEY
  }
});

const finnhub = axios.create({
  baseURL: 'https://finnhub.io/api/v1',
  headers: {
    'X-Finnhub-Token': config.FINNHUB_API_KEY
  }
});

const fmp = axios.create({
  baseURL: 'https://financialmodelingprep.com/api/v3',
  params: {
    apikey: config.FMP_API_KEY
  }
});

export const stockAPI = {
  // Growth Metrics
  async getGrowthMetrics(symbol) {
    const response = await alphaVantage.get('', {
      params: {
        function: 'OVERVIEW',
        symbol
      }
    });
    
    return {
      revenueGrowthYOY: response.data.RevenueTTM,
      profitGrowthYOY: response.data.ProfitMargin,
      epsGrowthYOY: response.data.EPS,
      quarterlyGrowth: response.data.QuarterlyEarningsGrowthYOY
    };
  },

  // Margin Analysis
  async getMarginAnalysis(symbol) {
    const response = await fmp.get(`/ratios/${symbol}`);
    
    return {
      grossMargin: response.data[0].grossProfitMargin,
      operatingMargin: response.data[0].operatingProfitMargin,
      netMargin: response.data[0].netProfitMargin,
      ebitdaMargin: response.data[0].ebitdaMargin
    };
  },

  // Sector Analysis
  async getSectorAnalysis(symbol) {
    const response = await finnhub.get(`/stock/peers`, {
      params: { symbol }
    });
    
    const sectorData = await Promise.all(
      response.data.map(peer => 
        finnhub.get('/stock/metric', {
          params: {
            symbol: peer,
            metric: 'all'
          }
        })
      )
    );

    return {
      peers: response.data,
      metrics: sectorData.map(d => d.data)
    };
  },

  // ESG Data
  async getESGData(symbol) {
    const response = await finnhub.get('/stock/esg', {
      params: { symbol }
    });
    
    return response.data;
  },

  // SEC Filings
  async getSECFilings(symbol) {
    const response = await fmp.get(`/sec_filings/${symbol}`);
    
    return response.data.slice(0, 10); // Get last 10 filings
  },

  // Stock Split History
  async getSplitHistory(symbol) {
    const response = await fmp.get(`/historical-price-full/stock_split/${symbol}`);
    
    return response.data.historical;
  },

  // Management Team
  async getManagementTeam(symbol) {
    const response = await fmp.get(`/key-executives/${symbol}`);
    
    return response.data;
  },

  // Financial Ratios
  async getFinancialRatios(symbol) {
    const response = await fmp.get(`/ratios/${symbol}`);
    
    return response.data[0];
  },

  // Price Trend Analysis
  async getPriceTrend(symbol) {
    const response = await alphaVantage.get('', {
      params: {
        function: 'TIME_SERIES_DAILY',
        symbol,
        outputsize: 'compact'
      }
    });
    
    return response.data['Time Series (Daily)'];
  },

  // Support/Resistance Levels
  async getSupportResistance(symbol) {
    const priceData = await this.getPriceTrend(symbol);
    return calculatePivotPoints(priceData);
  }
};

// Helper function for pivot point calculations
function calculatePivotPoints(priceData) {
  const latest = Object.values(priceData)[0];
  const high = parseFloat(latest['2. high']);
  const low = parseFloat(latest['3. low']);
  const close = parseFloat(latest['4. close']);
  
  const pp = (high + low + close) / 3;
  
  return {
    pivotPoint: pp,
    resistance: {
      r1: 2 * pp - low,
      r2: pp + (high - low),
      r3: high + 2 * (pp - low)
    },
    support: {
      s1: 2 * pp - high,
      s2: pp - (high - low),
      s3: low - 2 * (high - pp)
    }
  };
} 