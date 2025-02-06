import baseCommands from './baseCommands';
import { formatters } from './formatters';
import { dataAggregator } from '../../services/dataAggregator';

export const futuresCommands = {
  ...baseCommands,

  QUOTE: async (symbol) => {
    const data = await dataAggregator.getFuturesQuote(symbol);
    return `
FUTURES QUOTE FOR ${symbol}
------------------------
CURRENT TRADING
-------------
Price:           ${formatters.price(data.lastPrice)}
Change:          ${formatters.price(data.priceChange)} (${formatters.percent(data.percentChange)})
Volume:          ${formatters.number(data.volume)} contracts
Open Interest:   ${formatters.number(data.openInterest)} contracts

CONTRACT INFO
-----------
Expiry:          ${new Date(data.expirationDate).toLocaleDateString()}
Days to Expiry:  ${data.daysToExpiry}
Settlement:      ${data.settlementType}
Contract Size:   ${formatters.number(data.contractSize)}`;
  },

  TERM: async (symbol) => {
    const data = await dataAggregator.getFuturesTerm(symbol);
    return `
TERM STRUCTURE FOR ${symbol}
-------------------------
ACTIVE CONTRACTS
--------------
${data.contracts.map(contract => `
${contract.expiry.padEnd(12)} ${formatters.price(contract.price).padEnd(10)} ` +
`OI: ${formatters.number(contract.openInterest).padEnd(8)} ` +
`Vol: ${formatters.number(contract.volume)}`
).join('\n')}

SPREADS
------
Front:           ${formatters.price(data.frontSpread)}
Back:            ${formatters.price(data.backSpread)}
Curve:           ${data.curveShape}

BASIS
----
Spot-Future:     ${formatters.price(data.basis)}
Implied Rate:    ${formatters.percent(data.impliedRate)}
Fair Value:      ${formatters.price(data.fairValue)}`;
  },

  COT: async (symbol) => {
    const data = await dataAggregator.getCOTData(symbol);
    return `
COT REPORT FOR ${symbol}
----------------------
COMMERCIAL POSITIONS
-----------------
Long:            ${formatters.number(data.commercialLong)}
Short:           ${formatters.number(data.commercialShort)}
Net:             ${formatters.number(data.commercialNet)}
Net Change:      ${formatters.number(data.commercialNetChange)}

NON-COMMERCIAL
------------
Long:            ${formatters.number(data.nonCommercialLong)}
Short:           ${formatters.number(data.nonCommercialShort)}
Net:             ${formatters.number(data.nonCommercialNet)}
Net Change:      ${formatters.number(data.nonCommercialNetChange)}

ANALYSIS
-------
Commercial:      ${data.commercialPositioning}
Non-Commercial:  ${data.nonCommercialPositioning}
Market Sentiment: ${data.marketSentiment}`;
  },

  VOL: async (symbol) => {
    const data = await dataAggregator.getFuturesVolatility(symbol);
    return `
VOLATILITY ANALYSIS FOR ${symbol}
------------------------------
IMPLIED VOLATILITY
----------------
Front Month:     ${formatters.percent(data.frontMonthIV)}
Back Month:      ${formatters.percent(data.backMonthIV)}
IV Skew:         ${formatters.number(data.ivSkew)}

HISTORICAL VOL
------------
10-Day:          ${formatters.percent(data.hv10)}
30-Day:          ${formatters.percent(data.hv30)}
90-Day:          ${formatters.percent(data.hv90)}

VOLATILITY RATIOS
--------------
IV/HV Ratio:     ${formatters.number(data.ivHvRatio)}
Term Structure:   ${formatters.number(data.volTermStructure)}`;
  },

  MARGIN: async (symbol) => {
    const data = await dataAggregator.getFuturesMargin(symbol);
    return `
MARGIN REQUIREMENTS FOR ${symbol}
-----------------------------
INITIAL MARGIN
------------
Outright:        ${formatters.price(data.initialMargin)}
Spread:          ${formatters.price(data.spreadMargin)}
Hedge:           ${formatters.price(data.hedgeMargin)}

MAINTENANCE
---------
Outright:        ${formatters.price(data.maintenanceMargin)}
Spread:          ${formatters.price(data.spreadMaintenance)}
Hedge:           ${formatters.price(data.hedgeMaintenance)}

PERFORMANCE BOND
-------------
Scanning Range:  ${formatters.percent(data.scanningRange)}
Inter-Month:     ${formatters.percent(data.interMonthRate)}
Inter-Commodity: ${formatters.percent(data.interCommodityRate)}`;
  },

  ROLL: async (symbol) => {
    const data = await dataAggregator.getFuturesRoll(symbol);
    return `
ROLL ANALYSIS FOR ${symbol}
------------------------
ROLL YIELDS
---------
Front-Back:      ${formatters.percent(data.frontBackYield)}
Annual Yield:    ${formatters.percent(data.annualizedYield)}
Roll Score:      ${formatters.number(data.rollScore)}

HISTORICAL ROLLS
-------------
Last Roll:       ${formatters.price(data.lastRollCost)}
Avg Roll Cost:   ${formatters.price(data.avgRollCost)}
Roll Volatility: ${formatters.percent(data.rollVolatility)}

NEXT ROLL
--------
First Notice:    ${data.firstNoticeDate}
Roll Period:     ${data.rollPeriodStart} - ${data.rollPeriodEnd}
Est. Roll Cost:  ${formatters.price(data.estimatedRollCost)}`;
  }
};

// Helper functions
const calculateRollYield = (frontPrice, backPrice, daysToRoll) => {
  const annualFactor = 365 / daysToRoll;
  return ((backPrice / frontPrice - 1) * annualFactor);
};

const getRollSignal = (rollScore) => {
  if (rollScore > 0.7) return 'STRONG ROLL';
  if (rollScore > 0.3) return 'MODERATE ROLL';
  if (rollScore < -0.7) return 'DEFER ROLL';
  if (rollScore < -0.3) return 'CONSIDER DEFERRAL';
  return 'NEUTRAL';
};

export default futuresCommands;