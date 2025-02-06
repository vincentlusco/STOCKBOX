export function calculateRSI(prices, period = 14) {
  if (!prices || prices.length < period + 1) return 50;

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

export function calculateMACD(prices, fastPeriod = 12, slowPeriod = 26, signalPeriod = 9) {
  if (!prices || prices.length < slowPeriod) {
    return { macdLine: 0, signalLine: 0, histogram: 0 };
  }

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

export function calculateEMA(prices, period) {
  const multiplier = 2 / (period + 1);
  let ema = [prices[0]];

  for (let i = 1; i < prices.length; i++) {
    ema.push((prices[i] - ema[i - 1]) * multiplier + ema[i - 1]);
  }

  return ema;
}

export function calculateSMA(prices, period) {
  if (!prices || prices.length < period) return 0;

  const sma = [];
  for (let i = period - 1; i < prices.length; i++) {
    const sum = prices.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
    sma.push(sum / period);
  }

  return sma[sma.length - 1];
}

export function calculateBollingerBands(prices, period = 20, stdDev = 2) {
  if (!prices || prices.length < period) {
    return { upper: 0, middle: 0, lower: 0 };
  }

  const middle = calculateSMA(prices, period);
  const variance = prices.slice(-period).reduce((sum, price) => {
    return sum + Math.pow(price - middle, 2);
  }, 0) / period;
  const std = Math.sqrt(variance);

  return {
    upper: middle + (stdDev * std),
    middle,
    lower: middle - (stdDev * std)
  };
} 