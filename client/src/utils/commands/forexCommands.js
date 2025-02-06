import baseCommands from './baseCommands';
import { formatters } from './formatters';
import { dataAggregator } from '../../services/dataAggregator';
import { websocketService } from '../../services/websocketService';

export const forexCommands = {
  ...baseCommands,

  // Real-time exchange rates with WebSocket support
  PRICE: async (symbol) => {
    try {
      const data = await dataAggregator.getForexRate(symbol);
      
      // Subscribe to real-time updates
      websocketService.subscribe(`FOREX:${symbol}`, (update) => {
        return formatForexPrice(update);
      });

      return formatForexPrice(data);
    } catch (error) {
      if (error.response?.status === 429) {
        const fallbackData = await dataAggregator.getForexRateAlternative(symbol);
        return formatForexPrice(fallbackData);
      }
      throw new Error(`Unable to fetch forex rate: ${error.message}`);
    }
  },

  // Economic data from FRED
  ECO: async (symbol) => {
    try {
      const [base, quote] = symbol.split('/');
      const data = await dataAggregator.getForexEconomics(base, quote);
      
      return `
ECONOMIC INDICATORS
-----------------
${base} ECONOMY
------------
GDP Growth:      ${formatters.percent(data.base.gdpGrowth)}
Inflation:       ${formatters.percent(data.base.inflation)}
Interest Rate:   ${formatters.percent(data.base.interestRate)}
Unemployment:    ${formatters.percent(data.base.unemployment)}

${quote} ECONOMY
-------------
GDP Growth:      ${formatters.percent(data.quote.gdpGrowth)}
Inflation:       ${formatters.percent(data.quote.inflation)}
Interest Rate:   ${formatters.percent(data.quote.interestRate)}
Unemployment:    ${formatters.percent(data.quote.unemployment)}`;
    } catch (error) {
      throw new Error(`Unable to fetch economic data: ${error.message}`);
    }
  },

  // Flow analysis using Exchange Rate API data
  FLOW: async (symbol) => {
    const data = await dataAggregator.getSecurityData(symbol, 'FOREX', 'FLOW');
    return formatFlowData(data);
  },

  TECH: async (symbol) => {
    const data = await dataAggregator.getTechnicalData(symbol);
    const latestDate = Object.keys(data.sma)[0];

    return `
TECHNICAL ANALYSIS FOR ${symbol}
----------------------------
MOVING AVERAGES
-------------
SMA (20):        ${formatters.price(data.sma[latestDate]['SMA'])}
Trend:           ${determineTrend(data.sma)}

MOMENTUM
-------
RSI (14):        ${formatters.number(data.rsi[latestDate]['RSI'])}
Signal:          ${getRSISignal(data.rsi[latestDate]['RSI'])}

MACD
----
MACD Line:       ${formatters.number(data.macd[latestDate]['MACD'])}
Signal Line:     ${formatters.number(data.macd[latestDate]['MACD_Signal'])}
Histogram:       ${formatters.number(data.macd[latestDate]['MACD_Hist'])}`;
  },

  RATE: (symbol, data) => {
    const { rates } = data;
    if (!rates) throw new Error('Interest rate data not available');
    
    return `
INTEREST RATE DATA FOR ${symbol}
-----------------------------
BASE CURRENCY (${rates.baseCurrency})
----------------------------------
Policy Rate:     ${formatters.percent(rates.baseRate)}
Forward Rate:    ${formatters.percent(rates.baseForward)}
Implied Rate:    ${formatters.percent(rates.baseImplied)}

QUOTE CURRENCY (${rates.quoteCurrency})
-----------------------------------
Policy Rate:     ${formatters.percent(rates.quoteRate)}
Forward Rate:    ${formatters.percent(rates.quoteForward)}
Implied Rate:    ${formatters.percent(rates.quoteImplied)}

DIFFERENTIALS
-----------
Rate Diff:       ${formatters.percent(rates.rateDifferential)}
Forward Points:  ${formatters.number(rates.forwardPoints)}
Carry Return:    ${formatters.percent(rates.carryReturn)}`;
  },

  CROSS: (symbol, data) => {
    const { crosses } = data;
    if (!crosses) throw new Error('Cross rates not available');
    
    return `
CROSS RATES FOR ${symbol}
-----------------------
MAJOR CROSSES
-----------
${crosses.major.map(c => 
  `${c.pair.padEnd(10)} ${formatters.price(c.rate).padStart(10)} (${formatters.percent(c.change)})`
).join('\n')}

CORRELATIONS
----------
${crosses.correlations.map(c => 
  `${c.pair.padEnd(10)} ${c.correlation.toFixed(2).padStart(6)} (${c.period})`
).join('\n')}

ARBITRAGE
--------
Triangular:      ${crosses.arbitrage.triangular ? 'Yes' : 'No'}
Cross Rate:      ${formatters.price(crosses.arbitrage.impliedRate)}
Direct Rate:     ${formatters.price(crosses.arbitrage.directRate)}
Difference:      ${formatters.percent(crosses.arbitrage.difference)}`;
  },

  CENT: (symbol, data) => {
    const { central } = data;
    if (!central) throw new Error('Central bank data not available');
    
    return `
CENTRAL BANK MONITOR FOR ${symbol}
-------------------------------
BASE CURRENCY (${central.baseCurrency})
----------------------------------
Current Rate:    ${formatters.percent(central.baseRate)}
Next Meeting:    ${central.baseNextMeeting}
Probability:     ${central.baseProbability.map(p => 
  `\n  ${p.action}: ${formatters.percent(p.probability)}`
).join('')}

QUOTE CURRENCY (${central.quoteCurrency})
-----------------------------------
Current Rate:    ${formatters.percent(central.quoteRate)}
Next Meeting:    ${central.quoteNextMeeting}
Probability:     ${central.quoteProbability.map(p => 
  `\n  ${p.action}: ${formatters.percent(p.probability)}`
).join('')}`;
  },

  MACRO: (symbol, data) => {
    const { macro } = data;
    if (!macro) throw new Error('Macro data not available');
    
    return `
MACRO INDICATORS FOR ${symbol}
---------------------------
BASE ECONOMY (${macro.baseCountry})
-------------------------------
GDP Growth:      ${formatters.percent(macro.baseGdp)}
Inflation:       ${formatters.percent(macro.baseCpi)}
Unemployment:    ${formatters.percent(macro.baseUnemployment)}
Trade Balance:   ${formatters.largeNumber(macro.baseTradeBalance)}

QUOTE ECONOMY (${macro.quoteCountry})
--------------------------------
GDP Growth:      ${formatters.percent(macro.quoteGdp)}
Inflation:       ${formatters.percent(macro.quoteCpi)}
Unemployment:    ${formatters.percent(macro.quoteUnemployment)}
Trade Balance:   ${formatters.largeNumber(macro.quoteTradeBalance)}`;
  },

  RISK: (symbol, data) => {
    const { risk } = data;
    if (!risk) throw new Error('Risk data not available');
    
    return `
RISK ANALYSIS FOR ${symbol}
-------------------------
VOLATILITY METRICS
---------------
Daily Vol:       ${formatters.percent(risk.dailyVol)}
Weekly Vol:      ${formatters.percent(risk.weeklyVol)}
Monthly Vol:     ${formatters.percent(risk.monthlyVol)}
ATR (14):        ${risk.atr.toFixed(5)}

OPTIONS METRICS
------------
Risk Reversal:   ${risk.riskReversal.toFixed(2)}
Butterfly:       ${risk.butterfly.toFixed(2)}
Implied Vol:     ${formatters.percent(risk.impliedVol)}
Vol Surface:     ${risk.volSurface.map(v => 
  `\n  ${v.tenor}: ${formatters.percent(v.vol)}`
).join('')}`;
  },

  CARRY: async (symbol) => {
    const [base, quote] = symbol.split('/');
    const data = await dataAggregator.getForexEconomics(base, quote);
    
    const rateDiff = data.base.interestRate - data.quote.interestRate;
    const volatility = await calculateHistoricalVolatility(symbol);
    const carryScore = calculateCarryScore(rateDiff, volatility);
    
    return `
CARRY TRADE ANALYSIS FOR ${symbol}
------------------------------
INTEREST RATES
------------
${base} Rate:        ${formatters.percent(data.base.interestRate)}
${quote} Rate:       ${formatters.percent(data.quote.interestRate)}
Differential:    ${formatters.percent(rateDiff)}

RISK METRICS
----------
Volatility:      ${formatters.percent(volatility)}
Sharpe Ratio:    ${formatters.number(rateDiff / volatility)}
Carry Score:     ${formatters.number(carryScore)} (${getCarrySignal(carryScore)})

ANNUAL RETURNS
-----------
Interest Only:   ${formatters.percent(rateDiff)}
Total Return:    ${formatters.percent(rateDiff - volatility * 0.5)}
Risk-Adj Return: ${formatters.percent((rateDiff - volatility * 0.5) / volatility)}`;
  },

  TRADE: (symbol, data) => {
    const { trade } = data;
    if (!trade) throw new Error('Trade data not available');
    
    return `
TRADE BALANCE DATA FOR ${symbol}
-----------------------------
CURRENT ACCOUNT
-------------
Balance:         ${formatters.largeNumber(trade.currentBalance)}
% of GDP:        ${formatters.percent(trade.balanceToGdp)}
Trend:           ${trade.trend}

TRADE FLOWS
---------
Exports:         ${formatters.largeNumber(trade.exports)}
Imports:         ${formatters.largeNumber(trade.imports)}
Net Flow:        ${formatters.largeNumber(trade.netFlow)}

HISTORICAL
--------
12M Average:     ${formatters.largeNumber(trade.average12m)}
YoY Change:      ${formatters.percent(trade.yoyChange)}
Forecast:        ${formatters.largeNumber(trade.forecast)}`;
  },

  REAL: (symbol, data) => {
    const { real } = data;
    if (!real) throw new Error('Real exchange rate data not available');
    
    return `
REAL EXCHANGE RATE FOR ${symbol}
-----------------------------
REER METRICS
----------
Current REER:    ${formatters.number(real.reer)}
vs 5Y Average:   ${formatters.percent(real.vs5yAvg)}
Misalignment:    ${formatters.percent(real.misalignment)}

ADJUSTMENTS
---------
PPP Rate:        ${formatters.price(real.pppRate)}
Terms of Trade:  ${formatters.number(real.termsOfTrade)}
Productivity:    ${formatters.percent(real.productivity)}

COMPETITIVENESS
------------
Index:           ${real.competitiveIndex.toFixed(2)}
Ranking:         ${real.ranking}
Change YoY:      ${formatters.percent(real.rankChange)}`;
  },

  FORWARD: async (symbol) => {
    const data = await dataAggregator.getForwardRates(symbol);
    if (!data.forward) throw new Error('Forward rates not available');
    
    return `
FORWARD RATES FOR ${symbol}
------------------------
OUTRIGHT FORWARDS
--------------
1M:              ${formatters.price(data.forward.rate1m)}
3M:              ${formatters.price(data.forward.rate3m)}
6M:              ${formatters.price(data.forward.rate6m)}
1Y:              ${formatters.price(data.forward.rate1y)}

FORWARD POINTS
-----------
1M Points:       ${data.forward.points1m}
3M Points:       ${data.forward.points3m}
6M Points:       ${data.forward.points6m}
1Y Points:       ${data.forward.points1y}

SWAP RATES
--------
Tom/Next:        ${formatters.percent(data.forward.swapTn)}
Spot/Next:       ${formatters.percent(data.forward.swapSn)}
1W Swap:         ${formatters.percent(data.forward.swap1w)}`;
  }
};

// Helper Functions
const formatForexPrice = (data) => {
  return `
FOREX RATE FOR ${data.symbol}
-------------------------
CURRENT RATE
-----------
Rate:            ${formatters.price(data.rate)}
Change:          ${formatters.price(data.change)} (${formatters.percent(data.changePercent)})
Updated:         ${new Date(data.timestamp).toLocaleString()}

DAILY RANGE
---------
High:            ${formatters.price(data.dayHigh)}
Low:             ${formatters.price(data.dayLow)}
Open:            ${formatters.price(data.dayOpen)}`;
};

const formatFlowData = (data) => {
  const trend = determineTrend(data.technicals.sma);
  const signal = getRSISignal(data.technicals.rsi);
  
  return `
FLOW ANALYSIS FOR ${data.symbol}
---------------------------
POSITIONING
---------
Net Position:    ${formatters.number(data.flow.netPosition)}
Change:          ${formatters.number(data.flow.positionChange)}
Signal:          ${trend} (${signal})

VOLUME ANALYSIS
------------
Daily Volume:    ${formatters.largeNumber(data.flow.volume)}
vs. Average:     ${formatters.percent(data.flow.volumeVsAvg)}
Large Orders:    ${formatters.number(data.flow.largeOrders)}`;
};

const determineTrend = (smaData) => {
  const dates = Object.keys(smaData).slice(0, 5);
  const values = dates.map(d => parseFloat(smaData[d]['SMA']));
  const trend = values[0] > values[4] ? 'UPTREND' : 'DOWNTREND';
  const strength = Math.abs(values[0] - values[4]) / values[4];
  return strength > 0.02 ? `STRONG ${trend}` : `WEAK ${trend}`;
};

const getRSISignal = (rsi) => {
  if (rsi > 70) return 'OVERBOUGHT';
  if (rsi < 30) return 'OVERSOLD';
  return 'NEUTRAL';
};

const calculateHistoricalVolatility = (prices, period = 20) => {
  if (prices.length < period) return 0;
  const returns = prices.slice(1).map((p, i) => Math.log(p / prices[i]));
  const mean = returns.reduce((a, b) => a + b) / returns.length;
  const variance = returns.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / returns.length;
  return Math.sqrt(variance * 252) * 100;
};

const calculateCarryScore = (data) => {
  const { interestDiff, volatility, trend } = data;
  return (interestDiff * 2 + trend - volatility * 0.5) / 3;
};

const getCarrySignal = (score) => {
  if (score > 0.7) return 'STRONG CARRY';
  if (score > 0.3) return 'MODERATE CARRY';
  if (score < -0.3) return 'NEGATIVE CARRY';
  return 'NEUTRAL';
};

export default forexCommands;