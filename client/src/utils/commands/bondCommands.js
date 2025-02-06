import baseCommands from './baseCommands';
import { formatters } from './formatters';
import { dataAggregator } from '../../services/dataAggregator';

export const bondCommands = {
  ...baseCommands,

  QUOTE: async (symbol) => {
    const data = await dataAggregator.getBondQuote(symbol);
    return `
BOND QUOTE FOR ${symbol}
---------------------
CURRENT TRADING
-------------
Price:           ${formatters.price(data.price)}
Yield:           ${formatters.percent(data.yield)}
Change:          ${formatters.price(data.priceChange)} (${formatters.percent(data.yieldChange)})

BOND INFO
--------
Coupon:          ${formatters.percent(data.coupon)}
Maturity:        ${new Date(data.maturityDate).toLocaleDateString()}
Duration:        ${formatters.number(data.duration)}
Rating:          ${data.rating}`;
  },

  CURVE: async (symbol) => {
    // Using FRED Treasury data
    const data = await dataAggregator.getYieldCurve();
    return `
TREASURY YIELD CURVE
-----------------
RATES
-----
3-Month:         ${formatters.percent(data.m3)}
6-Month:         ${formatters.percent(data.m6)}
1-Year:          ${formatters.percent(data.y1)}
2-Year:          ${formatters.percent(data.y2)}
5-Year:          ${formatters.percent(data.y5)}
10-Year:         ${formatters.percent(data.y10)}
30-Year:         ${formatters.percent(data.y30)}

SPREADS
------
2s10s:           ${formatters.number(data.y10 - data.y2)} bps
3m10y:           ${formatters.number(data.y10 - data.m3)} bps
Inversion:       ${data.y10 < data.y2 ? 'YES' : 'NO'}`;
  },

  SPREAD: async (symbol) => {
    const data = await dataAggregator.getBondSpreads(symbol);
    return `
SPREAD ANALYSIS FOR ${symbol}
--------------------------
VS TREASURY
---------
vs 2Y:           ${formatters.number(data.spread2Y)} bps
vs 5Y:           ${formatters.number(data.spread5Y)} bps
vs 10Y:          ${formatters.number(data.spread10Y)} bps
vs 30Y:          ${formatters.number(data.spread30Y)} bps`;
  },

  RATES: async () => {
    // Using FRED interest rate data
    const data = await dataAggregator.getKeyRates();
    return `
KEY INTEREST RATES
----------------
FED RATES
--------
Fed Funds:       ${formatters.percent(data.fedFunds)}
Discount Rate:   ${formatters.percent(data.discountRate)}
IOER:            ${formatters.percent(data.ioer)}

MARKET RATES
----------
LIBOR 3M:        ${formatters.percent(data.libor3m)}
Prime Rate:      ${formatters.percent(data.primeRate)}
SOFR:            ${formatters.percent(data.sofr)}`;
  }
};

// Helper function
const getCurveSteepness = (spread) => {
  if (spread > 150) return 'VERY STEEP';
  if (spread > 100) return 'STEEP';
  if (spread > 50) return 'NORMAL';
  if (spread > 0) return 'FLAT';
  return 'INVERTED';
};

export default bondCommands; 