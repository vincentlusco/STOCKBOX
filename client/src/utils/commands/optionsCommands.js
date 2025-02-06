import baseCommands from './baseCommands';
import { formatters } from './formatters';
import { dataAggregator } from '../../services/dataAggregator';
import { parseOptionsSymbol } from '../symbolParsers';

export const optionsCommands = {
  ...baseCommands,

  CHAIN: async (symbol) => {
    const chain = await dataAggregator.getOptionsChain(symbol);
    if (!chain) throw new Error('Option chain not available');
    
    return `
OPTIONS CHAIN FOR ${symbol}
------------------------
CALLS                          PUTS
-----                          ----
Strike  IV    Bid   Ask        IV    Bid   Ask
${chain.calls.map((call, i) => {
  const put = chain.puts[i];
  return `${formatters.price(call.strike).padEnd(8)} ` +
         `${formatters.percent(call.impliedVolatility).padEnd(6)} ` +
         `${formatters.price(call.bid).padEnd(6)} ` +
         `${formatters.price(call.ask).padEnd(8)} ` +
         `${formatters.percent(put.impliedVolatility).padEnd(6)} ` +
         `${formatters.price(put.bid).padEnd(6)} ` +
         `${formatters.price(put.ask)}`;
}).join('\n')}`;
  },

  QUOTE: async (symbol) => {
    const parsed = parseOptionsSymbol(symbol);
    const data = await dataAggregator.getOptionsQuote(symbol);
    
    return `
OPTION QUOTE FOR ${symbol}
-----------------------
OPTION DETAILS
-------------
Type:            ${parsed.type}
Strike:          ${formatters.price(parsed.strike)}
Expiration:      ${parsed.expiration.toLocaleDateString()}
Days to Expiry:  ${parsed.daysToExpiry}

CURRENT TRADING
-------------
Last:            ${formatters.price(data.lastPrice)}
Change:          ${formatters.price(data.change)} (${formatters.percent(data.percentChange)})
Bid:             ${formatters.price(data.bid)}
Ask:             ${formatters.price(data.ask)}
Volume:          ${formatters.number(data.volume)}
Open Interest:   ${formatters.number(data.openInterest)}

GREEKS
-----
Delta:           ${formatters.number(data.delta)}
Gamma:           ${formatters.number(data.gamma)}
Theta:           ${formatters.number(data.theta)}
Vega:            ${formatters.number(data.vega)}
IV:              ${formatters.percent(data.impliedVolatility)}`;
  },

  EXP: async (symbol) => {
    const dates = await dataAggregator.getOptionsExpirations(symbol);
    if (!dates?.length) throw new Error('No expiration dates available');
    
    return `
EXPIRATION DATES FOR ${symbol}
---------------------------
${dates.map(date => {
  const d = new Date(date);
  const daysToExp = Math.ceil((d - new Date()) / (1000 * 60 * 60 * 24));
  return `${d.toLocaleDateString().padEnd(12)} (${daysToExp} days)`;
}).join('\n')}`;
  },

  RISK: async (symbol) => {
    const parsed = parseOptionsSymbol(symbol);
    const data = await dataAggregator.getOptionsRisk(symbol);
    
    return `
RISK ANALYSIS FOR ${symbol}
------------------------
BREAKEVEN POINTS
--------------
Upside BE:       ${formatters.price(data.breakevenUp)}
Downside BE:     ${formatters.price(data.breakevenDown)}

MAX PROFIT/LOSS
-------------
Max Profit:      ${formatters.price(data.maxProfit)}
Max Loss:        ${formatters.price(data.maxLoss)}
Risk/Reward:     ${formatters.number(Math.abs(data.maxProfit / data.maxLoss))}

PROBABILITY
---------
Profit Prob:     ${formatters.percent(data.probProfit)}
BE+ Prob:        ${formatters.percent(data.probBreakeven)}
Max Profit Prob: ${formatters.percent(data.probMaxProfit)}`;
  },

  VOL: async (symbol) => {
    const data = await dataAggregator.getOptionsVolatility(symbol);
    
    return `
VOLATILITY ANALYSIS FOR ${symbol}
------------------------------
IMPLIED VOLATILITY
----------------
Current IV:      ${formatters.percent(data.currentIV)}
IV Percentile:   ${formatters.percent(data.ivPercentile)}
IV Rank:         ${formatters.percent(data.ivRank)}

HISTORICAL VOL
------------
10-Day HV:       ${formatters.percent(data.hv10)}
30-Day HV:       ${formatters.percent(data.hv30)}
60-Day HV:       ${formatters.percent(data.hv60)}
90-Day HV:       ${formatters.percent(data.hv90)}

SKEW
----
Put Skew:        ${formatters.number(data.putSkew)}
Call Skew:       ${formatters.number(data.callSkew)}
Term Skew:       ${formatters.number(data.termSkew)}`;
  },

  STRIKE: async (symbol, expiration) => {
    const strikes = await dataAggregator.getStrikes(symbol, expiration);
    if (!strikes?.length) throw new Error('No strikes available');
    
    return formatStrikes(strikes);
  },

  GREEK: async (symbol, data) => {
    const { quote } = data;
    if (!quote) throw new Error('Option data not available');
    
    const greeks = calculateGreeks({
      type: quote.type,
      strike: quote.strike,
      spot: quote.underlyingPrice,
      timeToExpiry: (new Date(quote.expiration) - new Date()) / (365 * 24 * 60 * 60 * 1000),
      volatility: quote.impliedVolatility,
      riskFreeRate: 0.05
    });
    
    return `
OPTION GREEKS FOR ${symbol}
-------------------------
FIRST ORDER GREEKS
----------------
Delta:           ${greeks.delta}         (Directional Risk)
Gamma:           ${greeks.gamma}         (Delta Change)
Theta:           ${greeks.theta}         (Time Decay/Day)
Vega:            ${greeks.vega}          (Vol Risk/1%)
Rho:             ${greeks.rho}           (Rate Risk/1%)

SECOND ORDER GREEKS
-----------------
Charm:           ${greeks.charm}         (Delta Decay)
Vanna:           ${greeks.vanna}         (Delta/Vol Risk)
Volga:           ${greeks.volga}         (Vega Convexity)
Vomma:           ${greeks.vomma}         (Vega/Vol Risk)
Speed:           ${greeks.speed}         (Gamma Change)
Zomma:           ${greeks.zomma}         (Gamma/Vol Risk)
Color:           ${greeks.color}         (Gamma Decay)

INPUTS
-----
Spot:            ${formatters.price(quote.underlyingPrice)}
Strike:          ${formatters.price(quote.strike)}
Time to Expiry:  ${(greeks.timeToExpiry * 365).toFixed(1)} days
Volatility:      ${formatters.percent(quote.impliedVolatility)}
Rate:            5.00%`;
  },

  FLOW: (symbol, data) => {
    const { flow } = data;
    if (!flow) throw new Error('Options flow data not available');
    
    return `
OPTIONS FLOW FOR ${symbol}
------------------------
SENTIMENT
--------
Put/Call Ratio:  ${flow.putCallRatio.toFixed(2)}
Buy/Sell Ratio:  ${flow.buySellRatio.toFixed(2)}
Volume/OI:       ${flow.volumeOIRatio.toFixed(2)}

NOTABLE TRADES
------------
${flow.notableTrades.map(t => `
${t.time} - ${t.type} ${t.strike} ${t.expiry}
Size: ${formatters.number(t.contracts)}
Prem: ${formatters.price(t.premium)}
Spot: ${formatters.price(t.spotPrice)}`
).join('\n')}`;
  },

  SWEEP: (symbol, data) => {
    const { sweeps } = data;
    if (!sweeps) throw new Error('Options sweep data not available');
    
    return `
OPTIONS SWEEPS FOR ${symbol}
-------------------------
LAST 5 SWEEPS
------------
${sweeps.recent.map(s => `
${s.time} - ${s.side} ${s.type}
Strike: ${formatters.price(s.strike)}
Exp:    ${s.expiration}
Size:   ${formatters.number(s.contracts)}
Prem:   ${formatters.price(s.premium)}
Aggr:   ${s.aggressive ? 'Yes' : 'No'}`
).join('\n')}

SUMMARY
------
Total Premium:   ${formatters.price(sweeps.totalPremium)}
Bullish Flow:    ${formatters.percent(sweeps.bullishPercent)}
Bearish Flow:    ${formatters.percent(sweeps.bearishPercent)}`;
  },

  SPREAD: (symbol, data) => {
    const { spreads } = data;
    if (!spreads) throw new Error('Spread analysis not available');
    
    return `
SPREAD ANALYSIS FOR ${symbol}
--------------------------
VERTICAL SPREADS
--------------
${spreads.verticals.map(v => `
${v.type} ${v.width} Point ${v.direction}
Cost:    ${formatters.price(v.cost)}
Max Gain: ${formatters.price(v.maxGain)}
BE:      ${formatters.price(v.breakEven)}
ROI:     ${formatters.percent(v.roi)}`
).join('\n')}

IRON CONDORS
----------
${spreads.ironCondors.map(ic => `
${ic.width} Point IC
Cost:    ${formatters.price(ic.cost)}
Max Gain: ${formatters.price(ic.maxGain)}
BE:      ${formatters.price(ic.lowerBE)} / ${formatters.price(ic.upperBE)}
POP:     ${formatters.percent(ic.probProfit)}`
).join('\n')}`;
  },

  STRAT: (symbol, data) => {
    const { strategy } = data;
    if (!strategy) throw new Error('Strategy data not available');
    
    return `
STRATEGY BUILDER FOR ${symbol}
---------------------------
CURRENT POSITION
--------------
${strategy.legs.map(l => `
${l.type} ${l.strike} ${l.expiry} ${l.side}
Contracts: ${formatters.number(l.contracts)}
Price:     ${formatters.price(l.price)}
Delta:     ${l.delta.toFixed(4)}`
).join('\n')}

POSITION METRICS
-------------
Total Cost:      ${formatters.price(strategy.totalCost)}
Max Risk:        ${formatters.price(strategy.maxRisk)}
Max Reward:      ${formatters.price(strategy.maxReward)}
Break Even:      ${strategy.breakEven.join(' / ')}
Prob Profit:     ${formatters.percent(strategy.probProfit)}

GREEKS
-----
Net Delta:       ${strategy.netGreeks.delta.toFixed(4)}
Net Gamma:       ${strategy.netGreeks.gamma.toFixed(4)}
Net Theta:       ${strategy.netGreeks.theta.toFixed(4)}
Net Vega:        ${strategy.netGreeks.vega.toFixed(4)}`;
  },

  SCAN: (symbol, data) => {
    const { scanner } = data;
    if (!scanner) throw new Error('Scanner data not available');
    
    return `
OPTIONS SCANNER FOR ${symbol}
--------------------------
HIGH VOLUME
---------
${scanner.highVolume.map(o => `
${o.strike} ${o.expiry} ${o.type}
Volume: ${formatters.number(o.volume)}
vs OI:  ${formatters.number(o.openInterest)}
Unusual: ${o.unusual ? 'Yes' : 'No'}`
).join('\n')}

UNUSUAL ACTIVITY
-------------
${scanner.unusual.map(u => `
${u.strike} ${u.expiry} ${u.type}
Premium: ${formatters.price(u.premium)}
Size:    ${formatters.number(u.size)}
Type:    ${u.activityType}`
).join('\n')}`;
  },

  EARN: (symbol, data) => {
    const { earnings } = data;
    if (!earnings) throw new Error('Earnings data not available');
    
    return `
EARNINGS ANALYSIS FOR ${symbol}
----------------------------
NEXT EARNINGS
-----------
Date:            ${earnings.nextDate}
Expected Move:   ${formatters.percent(earnings.expectedMove)}
Straddle Price:  ${formatters.price(earnings.straddlePrice)}
IV Premium:      ${formatters.percent(earnings.ivPremium)}

HISTORICAL MOVES
-------------
${earnings.history.map(h => `
${h.date}
Expected: ${formatters.percent(h.expectedMove)}
Actual:   ${formatters.percent(h.actualMove)}
Gap:      ${formatters.percent(h.gap)}`
).join('\n')}`;
  },

  SURFACE: (symbol, data) => {
    const { surface } = data;
    if (!surface) throw new Error('Volatility surface not available');
    
    return `
VOLATILITY SURFACE FOR ${symbol}
-----------------------------
BY EXPIRATION
-----------
${surface.term.map(t => `
${t.expiry.padEnd(12)}
ATM IV:  ${formatters.percent(t.atmIv)}
25D RR:  ${t.rr25.toFixed(1)}
10D RR:  ${t.rr10.toFixed(1)}`
).join('\n')}

BY STRIKE (${surface.selectedExp})
--------------------------------
${surface.smile.map(s => `
${s.strike.toString().padStart(8)}
IV:    ${formatters.percent(s.iv)}
Delta: ${s.delta.toFixed(2)}`
).join('\n')}`;
  },

  PROB: (symbol, data) => {
    const { probability } = data;
    if (!probability) throw new Error('Probability calculator not available');
    
    return `
PROBABILITY CALCULATOR FOR ${symbol}
--------------------------------
PRICE TARGETS
-----------
Above ${formatters.price(probability.upTarget)}:   ${formatters.percent(probability.probAbove)}
Below ${formatters.price(probability.downTarget)}: ${formatters.percent(probability.probBelow)}
Between:                                          ${formatters.percent(probability.probBetween)}

EXPECTED RANGES
------------
1 STD (68%):    ${formatters.price(probability.range1sd.low)} - ${formatters.price(probability.range1sd.high)}
2 STD (95%):    ${formatters.price(probability.range2sd.low)} - ${formatters.price(probability.range2sd.high)}
3 STD (99.7%):  ${formatters.price(probability.range3sd.low)} - ${formatters.price(probability.range3sd.high)}`;
  },

  MARGIN: (symbol, data) => {
    const { margin } = data;
    if (!margin) throw new Error('Margin requirements not available');
    
    return `
MARGIN REQUIREMENTS FOR ${symbol}
------------------------------
SINGLE OPTIONS
------------
Long Call/Put:   ${formatters.price(margin.longOption)}
Short Call:      ${formatters.price(margin.shortCall)}
Short Put:       ${formatters.price(margin.shortPut)}

SPREADS
------
Vertical:        ${formatters.price(margin.vertical)}
Iron Condor:     ${formatters.price(margin.ironCondor)}
Calendar:        ${formatters.price(margin.calendar)}

POSITION MARGIN
------------
Initial Req:     ${formatters.price(margin.initialReq)}
Maintenance:     ${formatters.price(margin.maintenanceReq)}
Current Usage:   ${formatters.percent(margin.marginUsed)}`;
  },

  ROLL: (symbol, data) => {
    const { roll } = data;
    if (!roll) throw new Error('Roll analysis not available');
    
    return `
ROLL ANALYSIS FOR ${symbol}
-------------------------
CURRENT POSITION
--------------
Strike:          ${formatters.price(roll.currentStrike)}
Expiration:      ${roll.currentExp}
Days Left:       ${roll.daysLeft}
P/L:             ${formatters.price(roll.currentPnL)}

ROLL OPPORTUNITIES
---------------
${roll.opportunities.map(r => `
To: ${r.expiry} ${formatters.price(r.strike)}
Credit:  ${formatters.price(r.credit)}
New BE:  ${formatters.price(r.newBreakEven)}
Delta:   ${r.newDelta.toFixed(4)}`
).join('\n')}`;
  },

  // Add test command
  TEST: async (symbol) => {
    const parsed = parseOptionsSymbol(symbol);
    return `
OPTION SYMBOL TEST FOR ${symbol}
---------------------------
PARSED DATA
----------
Underlying:      ${parsed.underlying}
Strike:          ${formatters.price(parsed.strike)}
Type:            ${parsed.type}
Expiration:      ${parsed.expiration.toLocaleDateString()}
Days to Expiry:  ${parsed.daysToExpiry}`;
  }
};

// Black-Scholes Greeks calculation helper
function calculateGreeks({ type, strike, spot, timeToExpiry, volatility, riskFreeRate }) {
  const isCall = type.toUpperCase() === 'CALL';
  const sqrt2pi = Math.sqrt(2 * Math.PI);
  const sqrtTime = Math.sqrt(timeToExpiry);
  
  // Calculate d1 and d2
  const d1 = (Math.log(spot / strike) + (riskFreeRate + volatility * volatility / 2) * timeToExpiry) / (volatility * sqrtTime);
  const d2 = d1 - volatility * sqrtTime;
  
  // Standard normal distribution functions
  const nd1 = (1 / sqrt2pi) * Math.exp(-d1 * d1 / 2);
  const nd2 = (1 / sqrt2pi) * Math.exp(-d2 * d2 / 2);
  const Nd1 = (1 + erf(d1 / Math.sqrt(2))) / 2;
  const Nd2 = (1 + erf(d2 / Math.sqrt(2))) / 2;
  
  // First-order Greeks
  const delta = isCall ? Nd1 : Nd1 - 1;
  const gamma = nd1 / (spot * volatility * sqrtTime);
  const vega = spot * sqrtTime * nd1 / 100; // Divided by 100 for percentage
  const theta = (-spot * nd1 * volatility / (2 * sqrtTime) 
                - riskFreeRate * strike * Math.exp(-riskFreeRate * timeToExpiry) 
                * (isCall ? Nd2 : -Nd2)) / 365; // Daily theta
  
  // Second-order Greeks
  const charm = -nd1 * (2 * (riskFreeRate - volatility * volatility / 2) * timeToExpiry 
                - d2 * volatility * sqrtTime) / (2 * timeToExpiry * volatility * sqrtTime);
  
  const vanna = -nd1 * d2 / volatility;
  
  const volga = vega * (d1 * d2 / volatility);
  
  // Additional Greeks
  const rho = strike * timeToExpiry * Math.exp(-riskFreeRate * timeToExpiry) 
              * (isCall ? Nd2 : -Nd2) / 100;
  
  const vomma = vega * (d1 * d2 / volatility);
  
  const speed = -gamma * (d1 / (spot * volatility * sqrtTime) + 1);
  
  const zomma = gamma * ((d1 * d1 - 1) / volatility);
  
  const color = -nd1 * (2 * riskFreeRate * timeToExpiry + 1 
                + d1 * (2 * riskFreeRate * timeToExpiry - d2 * volatility * sqrtTime)) 
                / (2 * timeToExpiry * timeToExpiry * volatility * spot * sqrtTime);
  
  return {
    // First-order Greeks
    delta: Number(delta.toFixed(4)),
    gamma: Number(gamma.toFixed(4)),
    theta: Number(theta.toFixed(4)),
    vega: Number(vega.toFixed(4)),
    rho: Number(rho.toFixed(4)),
    
    // Second-order Greeks
    charm: Number(charm.toFixed(4)),
    vanna: Number(vanna.toFixed(4)),
    volga: Number(volga.toFixed(4)),
    vomma: Number(vomma.toFixed(4)),
    speed: Number(speed.toFixed(4)),
    zomma: Number(zomma.toFixed(4)),
    color: Number(color.toFixed(4)),
    
    // Input parameters for reference
    timeToExpiry,
    impliedVol: volatility
  };
}

// Helper function for error function (erf)
function erf(x) {
  const t = 1 / (1 + 0.5 * Math.abs(x));
  const tau = t * Math.exp(-x * x - 1.26551223 + 
              t * (1.00002368 + 
              t * (0.37409196 + 
              t * (0.09678418 + 
              t * (-0.18628806 + 
              t * (0.27886807 + 
              t * (-1.13520398 + 
              t * (1.48851587 + 
              t * (-0.82215223 + 
              t * 0.17087277)))))))));
  return x >= 0 ? 1 - tau : tau - 1;
}

function formatStrikes(strikes) {
  // Implementation of formatStrikes function
  // This should return a formatted string representation of the strikes
}

export default optionsCommands; 