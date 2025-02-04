const express = require('express');
const router = express.Router();

// Add data validation helper
const isValidNumber = (num) => typeof num === 'number' && !isNaN(num);

const stockData = {
  basicInfo: {
    symbol: 'AAPL',
    name: 'Apple Inc.',
    exchange: 'NASDAQ',
    marketCap: 3.02e12,
    sector: 'Technology',
    industry: 'Consumer Electronics',
    currency: 'USD',
    tradingHours: '9:30-16:00 EST'
  },

  priceData: {
    currentPrice: 185.85,
    change: -2.15,
    changePercent: -1.15,
    bid: 185.80,
    ask: 185.90,
    bidSize: 500,
    askSize: 700,
    open: 187.15,
    high: 187.33,
    low: 184.21,
    close: 185.85,
    volume: 55892310,
    vwap: 185.92,
    fiftyTwoWeekHigh: 198.23,
    fiftyTwoWeekLow: 124.17
  },

  fundamentals: {
    pe: 31.25,
    forwardPE: 28.5,
    peg: 2.1,
    pb: 45.2,
    ps: 7.8,
    pfcf: 25.4,
    eps: 5.89,
    epsGrowth: 15.2,
    revenue: 394.32e9,
    revenueGrowth: 8.5,
    profitMargin: 25.8,
    operatingMargin: 32.1,
    roe: 145.2,
    roa: 28.5,
    roic: 35.2
  },

  balanceSheet: {
    totalAssets: 352.8e9,
    totalLiabilities: 278.2e9,
    cashAndEquivalents: 62.5e9,
    totalDebt: 110.2e9,
    currentRatio: 1.15,
    quickRatio: 0.92
  },

  marketData: {
    sharesFloat: 15.82e9,
    sharesOutstanding: 16.57e9,
    shortInterest: 89.5e6,
    daysToCover: 2.1,
    institutionalOwnership: 72.5,
    insiderOwnership: 0.15,
    shortPercent: 0.57,
    beta: 1.28
  }
};

const companyData = {
  'TSLA': {
    name: 'Tesla, Inc.',
    sector: 'Consumer Cyclical',
    industry: 'Auto Manufacturers',
    marketCap: 591.75e9,
    fundamentals: {
      pe: 42.89,
      forwardPE: 58.21,
      peg: 1.85,
      pb: 9.12,
      ps: 6.75,
      pfcf: 51.2,
      eps: 4.30,
      epsGrowth: 118.5,
      revenue: 96.77e9,
      revenueGrowth: 18.8,
      profitMargin: 13.9,
      operatingMargin: 11.4,
      roe: 21.4,
      roa: 9.8,
      roic: 15.7
    }
  },
  'AAPL': {
    name: 'Apple Inc.',
    sector: 'Technology',
    industry: 'Consumer Electronics',
    marketCap: 3.02e12,
    fundamentals: {
      pe: 31.25,
      forwardPE: 28.5,
      peg: 2.1,
      pb: 45.2,
      ps: 7.8,
      pfcf: 25.4,
      eps: 5.89,
      epsGrowth: 15.2,
      revenue: 394.32e9,
      revenueGrowth: 8.5,
      profitMargin: 25.8,
      operatingMargin: 32.1,
      roe: 145.2,
      roa: 28.5,
      roic: 35.2
    }
  }
};

router.get('/test/all-data', (req, res) => {
  const { symbol = 'AAPL' } = req.query;
  
  console.log('Received request for symbol:', symbol);
  
  const company = companyData[symbol] || {
    name: `${symbol}`,
    sector: 'N/A',
    industry: 'N/A',
    marketCap: 0,
    fundamentals: {}
  };
  
  // Create a copy of the data with the requested symbol
  const responseData = {
    basicInfo: {
      symbol: symbol,
      name: company.name,
      exchange: 'NASDAQ',
      marketCap: company.marketCap,
      sector: company.sector,
      industry: company.industry,
      currency: 'USD',
      tradingHours: '9:30-16:00 EST'
    },
    priceData: {
      currentPrice: getSimulatedPrice(symbol),
      change: (Math.random() - 0.5) * 5,
      changePercent: (Math.random() - 0.5) * 2,
      bid: getSimulatedPrice(symbol) - 0.1,
      ask: getSimulatedPrice(symbol) + 0.1,
      bidSize: Math.floor(Math.random() * 1000) + 100,
      askSize: Math.floor(Math.random() * 1000) + 100,
      volume: Math.floor(Math.random() * 10000000) + 1000000
    },
    fundamentals: company.fundamentals
  };

  // Helper function to get simulated prices for different symbols
  function getSimulatedPrice(symbol) {
    const basePrices = {
      'AAPL': 185,
      'QQQ': 232,
      'TSLA': 180,
      'MSFT': 420,
      'NVDA': 720,
      'SPY': 500
    };
    const basePrice = basePrices[symbol] || 100;
    return basePrice * (1 + (Math.random() - 0.5) * 0.01);
  }

  console.log('Sending response:', responseData.basicInfo.symbol);
  res.json(responseData);
});

module.exports = router; 