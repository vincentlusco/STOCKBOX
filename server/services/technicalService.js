const calculateRSI = (prices, period = 14) => {
  // Add RSI calculation
  let gains = 0;
  let losses = 0;
  
  for (let i = 1; i < prices.length; i++) {
    const difference = prices[i] - prices[i-1];
    if (difference >= 0) {
      gains += difference;
    } else {
      losses -= difference;
    }
  }
  
  const avgGain = gains / period;
  const avgLoss = losses / period;
  const rs = avgGain / avgLoss;
  return 100 - (100 / (1 + rs));
};

const calculateMACD = (prices) => {
  // Add MACD calculation
  const ema12 = calculateEMA(prices, 12);
  const ema26 = calculateEMA(prices, 26);
  const macd = ema12 - ema26;
  const signal = calculateEMA([macd], 9);
  
  return {
    macd,
    signal,
    histogram: macd - signal
  };
};

const calculateEMA = (prices, period) => {
  const multiplier = 2 / (period + 1);
  let ema = prices[0];
  
  for (let i = 1; i < prices.length; i++) {
    ema = (prices[i] - ema) * multiplier + ema;
  }
  return ema;
};

const calculateBollingerBands = (prices, period = 20) => {
  const sma = prices.slice(-period).reduce((a, b) => a + b) / period;
  const squaredDiffs = prices.slice(-period).map(p => Math.pow(p - sma, 2));
  const standardDeviation = Math.sqrt(squaredDiffs.reduce((a, b) => a + b) / period);
  
  return {
    upper: sma + (standardDeviation * 2),
    middle: sma,
    lower: sma - (standardDeviation * 2)
  };
};

const getTechnicalData = async (symbol, type, historicalPrices) => {
  const prices = historicalPrices.map(p => p.close);
  const rsi = calculateRSI(prices);
  const macd = calculateMACD(prices);
  const bollinger = calculateBollingerBands(prices);

  return {
    rsi,
    macd,
    bollinger
  };
};

module.exports = {
  getTechnicalData
}; 