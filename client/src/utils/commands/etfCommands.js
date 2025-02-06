import baseCommands from './baseCommands';
import { formatters } from './formatters';
import { formatPrice, formatNumber, formatPercent, formatLargeNumber } from '../formatters';
import { marketData } from '../../services/marketData';
import { dataAggregator } from '../../services/dataAggregator';

export const etfCommands = {
  ...baseCommands,

  QUOTE: async (symbol) => {
    const data = await dataAggregator.getETFQuote(symbol);
    return `
ETF QUOTE FOR ${symbol}
--------------------
CURRENT TRADING
-------------
Price:           ${formatters.price(data.price)}
Change:          ${formatters.price(data.change)} (${formatters.percent(data.percentChange)})
Volume:          ${formatters.number(data.volume)}
AUM:             ${formatters.largeNumber(data.aum)}

FUND INFO
--------
NAV:             ${formatters.price(data.nav)}
Premium:         ${formatters.percent(data.premium)}
Expense Ratio:   ${formatters.percent(data.expenseRatio)}`;
  },

  HOLD: async (symbol) => {
    const data = await dataAggregator.getETFHoldings(symbol);
    return `
HOLDINGS FOR ${symbol}
-------------------
TOP 10 HOLDINGS
-------------
${data.holdings.slice(0, 10).map(holding => 
  `${holding.symbol.padEnd(6)} ${holding.name.slice(0, 20).padEnd(20)} ${formatters.percent(holding.weight)}`
).join('\n')}

CONCENTRATION
-----------
Top 10:          ${formatters.percent(data.concentrationTop10)}
Top 25:          ${formatters.percent(data.concentrationTop25)}
Total Holdings:  ${formatters.number(data.totalHoldings)}`;
  },

  SECTOR: async (symbol) => {
    const data = await dataAggregator.getETFSectors(symbol);
    return `
SECTOR ALLOCATION FOR ${symbol}
----------------------------
${data.sectors.map(sector => 
  `${sector.name.padEnd(15)} ${formatters.percent(sector.weight)}`
).join('\n')}

CONCENTRATION
-----------
Top Sector:      ${data.sectors[0].name} (${formatters.percent(data.sectors[0].weight)})
Top 3 Sectors:   ${formatters.percent(data.sectors.slice(0, 3).reduce((sum, s) => sum + s.weight, 0))}`;
  },

  FLOW: async (symbol) => {
    const data = await dataAggregator.getETFFlows(symbol);
    return `
FUND FLOWS FOR ${symbol}
---------------------
FLOWS
----
1-Day:           ${formatters.largeNumber(data.flow1D)}
1-Week:          ${formatters.largeNumber(data.flow1W)}
1-Month:         ${formatters.largeNumber(data.flow1M)}
YTD:             ${formatters.largeNumber(data.flowYTD)}

METRICS
------
Assets:          ${formatters.largeNumber(data.aum)}
Shares Out:      ${formatters.number(data.sharesOutstanding)}
Avg Volume:      ${formatters.number(data.avgVolume)}`;
  },

  RISK: async (symbol) => {
    const data = await dataAggregator.getETFRisk(symbol);
    return `
RISK METRICS FOR ${symbol}
-----------------------
VOLATILITY
---------
1-Month:         ${formatters.percent(data.volatility1M)}
3-Month:         ${formatters.percent(data.volatility3M)}
1-Year:          ${formatters.percent(data.volatility1Y)}

METRICS
------
Beta:            ${formatters.number(data.beta)}
Sharpe Ratio:    ${formatters.number(data.sharpeRatio)}
Tracking Error:  ${formatters.percent(data.trackingError)}`;
  },

  PERF: async (symbol) => {
    const data = await dataAggregator.getETFPerformance(symbol);
    return `
PERFORMANCE FOR ${symbol}
----------------------
RETURNS
------
1-Month:         ${formatters.percent(data.return1M)}
3-Month:         ${formatters.percent(data.return3M)}
YTD:             ${formatters.percent(data.returnYTD)}
1-Year:          ${formatters.percent(data.return1Y)}
3-Year:          ${formatters.percent(data.return3Y)}
5-Year:          ${formatters.percent(data.return5Y)}

VS BENCHMARK
----------
1-Year Alpha:    ${formatters.percent(data.alpha)}
Tracking Diff:   ${formatters.percent(data.trackingDiff)}`;
  },

  PRICE: (symbol, data) => {
    const { quote } = data;
    if (!quote) throw new Error('Price data not available');
    
    return `
ETF PRICE DATA FOR ${symbol}
--------------------------
CURRENT TRADING
-------------
Price:           ${formatters.price(quote.price)}
Change:          ${formatters.price(quote.change)} (${formatters.percent(quote.changePercent)})
Volume:          ${formatters.number(quote.volume)}

NAV METRICS
----------
NAV:             ${formatters.price(quote.nav)}
Premium/Disc:    ${formatters.percent(quote.premium)}
iNAV:            ${formatters.price(quote.inav)}
Closing NAV:     ${formatters.price(quote.closingNav)}

FUND SIZE
--------
AUM:             ${formatters.largeNumber(quote.aum)}
Shares Out:      ${formatters.number(quote.sharesOutstanding)}
Avg Daily Vol:   ${formatters.number(quote.avgVolume)}`;
  },

  VOL: (symbol, data) => {
    const { quote, flow } = data;
    if (!quote || !flow) throw new Error('Volume data not available');
    
    return `
VOLUME ANALYSIS FOR ${symbol}
--------------------------
TRADING VOLUME
------------
Current Volume:   ${formatters.number(quote.volume)}
30D Avg Volume:   ${formatters.number(quote.avgVolume30)}
90D Avg Volume:   ${formatters.number(quote.avgVolume90)}
Relative Volume:  ${(quote.volume / quote.avgVolume30).toFixed(2)}x

CREATION/REDEMPTION
----------------
Units Created:    ${formatters.number(flow.unitsCreated)}
Units Redeemed:   ${formatters.number(flow.unitsRedeemed)}
Net Flow:         ${formatters.number(flow.netUnits)}
Block Size:       ${formatters.number(flow.creationUnit)}

LIQUIDITY METRICS
--------------
Bid-Ask Spread:   ${formatters.percent(quote.spread)}
$ Volume:         ${formatters.largeNumber(quote.dollarVolume)}
Turnover Rate:    ${formatters.percent(quote.turnoverRate)}`;
  },

  TECH: (symbol, data) => {
    const { technical } = data;
    if (!technical) throw new Error('Technical data not available');
    
    return `
ETF TECHNICAL ANALYSIS FOR ${symbol}
---------------------------------
RSI (14):        ${technical.rsi?.toFixed(2) || 'N/A'}
MACD:            ${technical.macd?.toFixed(2) || 'N/A'}
Signal:          ${technical.signal?.toFixed(2) || 'N/A'}
Histogram:       ${technical.histogram?.toFixed(2) || 'N/A'}

MOVING AVERAGES
-------------
MA (20):         ${formatPrice(technical.ma20)}
MA (50):         ${formatPrice(technical.ma50)}
MA (200):        ${formatPrice(technical.ma200)}`;
  },

  DES: (symbol, data) => {
    const { info } = data;
    if (!info) throw new Error('Fund information not available');
    
    return `
ETF DESCRIPTION FOR ${symbol}
---------------------------
Fund Name:       ${info.name}
Issuer:         ${info.issuer}
Inception Date:  ${info.inception}
Expense Ratio:   ${formatPercent(info.expenseRatio)}
Category:        ${info.category}
Strategy:        ${info.strategy}

INVESTMENT OBJECTIVE
------------------
${info.objective}

BENCHMARK INDEX
-------------
${info.benchmark}`;
  },

  HOLDINGS: (symbol, data) => {
    const { quote } = data;
    if (!quote?.holdings) {
      throw new Error('Holdings data not available');
    }

    const { holdings } = quote;
    
    return `
ETF HOLDINGS FOR ${symbol}
-------------------------
Total Holdings: ${holdings.total}
Assets:        ${formatters.largeNumber(holdings.totalAssets)}
Expense Ratio: ${formatters.percent(holdings.expenseRatio)}

TOP 10 HOLDINGS
--------------
${holdings.top10.map(h => 
  `${h.symbol.padEnd(6)} ${h.name.slice(0, 30).padEnd(30)} ${formatters.percent(h.weight)}`
).join('\n')}

SECTOR ALLOCATION
----------------
${holdings.sectors.map(s => 
  `${s.name.padEnd(20)} ${formatters.percent(s.weight)}`
).join('\n')}`;
  },

  DIST: (symbol, data) => {
    const { distributions } = data;
    if (!distributions) throw new Error('Distribution data not available');
    
    return `
DISTRIBUTION HISTORY FOR ${symbol}
-------------------------------
LATEST DISTRIBUTION
-----------------
Ex-Date:         ${distributions.latest.exDate}
Pay Date:        ${distributions.latest.payDate}
Amount:          ${formatters.price(distributions.latest.amount)}
Type:            ${distributions.latest.type}

ANNUAL METRICS
------------
Yield:           ${formatters.percent(distributions.yield)}
30-Day SEC:      ${formatters.percent(distributions.secYield)}
Tax Efficiency:  ${formatters.percent(distributions.taxEfficiency)}

DISTRIBUTION HISTORY
-----------------
${distributions.history.map(d => `
${d.exDate.padEnd(12)} ${d.type.padEnd(15)} ${formatters.price(d.amount)}
Tax Treatment: ${d.taxTreatment || 'N/A'}`
).join('\n')}`;
  },

  COST: (symbol, data) => {
    const { costs } = data;
    if (!costs) throw new Error('Cost data not available');
    
    return `
COST ANALYSIS FOR ${symbol}
-------------------------
FUND EXPENSES
-----------
Expense Ratio:   ${formatters.percent(costs.expenseRatio)}
Management Fee:  ${formatters.percent(costs.managementFee)}
Other Expenses:  ${formatters.percent(costs.otherExpenses)}
Fee Waiver:      ${formatters.percent(costs.feeWaiver)}
Net Expenses:    ${formatters.percent(costs.netExpenses)}

TRADING COSTS
-----------
Bid/Ask Spread:  ${formatters.percent(costs.bidAskSpread)}
Avg Volume:      ${formatters.number(costs.avgVolume)}
Premium/Disc:    ${formatters.percent(costs.premiumDiscount)}

TOTAL COST OF OWNERSHIP
--------------------
1 Year Hold:     ${formatters.percent(costs.totalCost.oneYear)}
3 Year Hold:     ${formatters.percent(costs.totalCost.threeYear)}
5 Year Hold:     ${formatters.percent(costs.totalCost.fiveYear)}
10 Year Hold:    ${formatters.percent(costs.totalCost.tenYear)}`;
  },

  TRACK: (symbol, data) => {
    const { tracking } = data;
    if (!tracking) throw new Error('Tracking data not available');
    
    return `
TRACKING ANALYSIS FOR ${symbol}
----------------------------
TRACKING METRICS
--------------
Error (1Y):      ${formatters.percent(tracking.trackingError)}
Difference:      ${formatters.percent(tracking.indexDifference)}
Correlation:     ${tracking.correlation?.toFixed(3) || 'N/A'}
Beta to Index:   ${tracking.betaToIndex?.toFixed(2) || 'N/A'}

REPLICATION EFFICIENCY
-------------------
Holdings Match:  ${formatters.percent(tracking.holdingsMatch)}
Sampling Error:  ${formatters.percent(tracking.samplingError)}
Tax Efficiency:  ${formatters.percent(tracking.taxEfficiency)}

HISTORICAL TRACKING
----------------
${tracking.history.map(t => `
${t.date}
Error: ${formatters.percent(t.trackingError)}
Diff:  ${formatters.percent(t.indexDifference)}`
).join('\n')}`;
  },

  IMPACT: (symbol, data) => {
    const { impact } = data;
    if (!impact) throw new Error('Impact data not available');
    
    return `
ESG IMPACT METRICS FOR ${symbol}
-----------------------------
ESG SCORES
---------
Overall:         ${impact.esgScore?.toFixed(1) || 'N/A'}
Environmental:   ${impact.environmentalScore?.toFixed(1) || 'N/A'}
Social:          ${impact.socialScore?.toFixed(1) || 'N/A'}
Governance:      ${impact.governanceScore?.toFixed(1) || 'N/A'}

SUSTAINABILITY METRICS
-------------------
Carbon Score:    ${impact.carbonScore?.toFixed(1) || 'N/A'}
Water Score:     ${impact.waterScore?.toFixed(1) || 'N/A'}
Social Impact:   ${impact.socialImpactScore?.toFixed(1) || 'N/A'}

CONTROVERSY CHECK
--------------
Flags:           ${impact.controversyFlags || 'None'}
Exclusions:      ${impact.exclusions || 'None'}
UN SDG Align:    ${impact.sdgAlignment || 'N/A'}`;
  },

  ALLOC: (symbol, data) => {
    const { allocation } = data;
    if (!allocation) throw new Error('Allocation data not available');
    
    return `
ASSET ALLOCATION FOR ${symbol}
---------------------------
ASSET CLASS BREAKDOWN
------------------
${allocation.assetClasses.map(a => 
  `${a.name.padEnd(15)} ${formatters.percent(a.weight)}`
).join('\n')}

GEOGRAPHIC EXPOSURE
----------------
${allocation.geography.map(g => 
  `${g.region.padEnd(15)} ${formatters.percent(g.weight)}`
).join('\n')}

CURRENCY EXPOSURE
--------------
${allocation.currency.map(c => 
  `${c.code.padEnd(5)} ${formatters.percent(c.weight)}`
).join('\n')}

STYLE ANALYSIS
-----------
Market Cap:      ${allocation.style.marketCap || 'N/A'}
Value/Growth:    ${allocation.style.valueGrowth || 'N/A'}
Credit Quality:  ${allocation.style.creditQuality || 'N/A'}
Duration:        ${allocation.style.duration || 'N/A'}`;
  },

  REBAL: (symbol, data) => {
    const { rebalance } = data;
    if (!rebalance) throw new Error('Rebalancing data not available');
    
    return `
REBALANCING HISTORY FOR ${symbol}
------------------------------
NEXT REBALANCE
------------
Date:            ${rebalance.nextDate || 'N/A'}
Type:            ${rebalance.type}
Est. Turnover:   ${formatters.percent(rebalance.estimatedTurnover)}

HISTORICAL REBALANCES
------------------
${rebalance.history.map(r => `
${r.date}
Type:     ${r.type}
Turnover: ${formatters.percent(r.turnover)}
Changes:  ${r.changes}`
).join('\n')}`;
  },

  COMP: async (symbol) => {
    const data = await dataAggregator.getETFComparison(symbol);
    return `
COMPARABLE ETFs FOR ${symbol}
-------------------------
SIMILAR FUNDS
-----------
${data.similar.map(fund => `
${fund.symbol.padEnd(6)} ${fund.name.slice(0, 20).padEnd(20)}
Expense:  ${formatters.percent(fund.expenseRatio)}
AUM:      ${formatters.largeNumber(fund.aum)}
Return:   ${formatters.percent(fund.return1Y)}`
).join('\n')}

CORRELATION
---------
Most Corr:       ${data.correlation.highest.symbol} (${formatters.percent(data.correlation.highest.value)})
Least Corr:      ${data.correlation.lowest.symbol} (${formatters.percent(data.correlation.lowest.value)})`;
  },

  TRACK: async (symbol) => {
    const data = await dataAggregator.getETFTracking(symbol);
    return `
TRACKING ANALYSIS FOR ${symbol}
---------------------------
TRACKING ERROR
------------
1-Month:         ${formatters.percent(data.trackingError1M)}
3-Month:         ${formatters.percent(data.trackingError3M)}
1-Year:          ${formatters.percent(data.trackingError1Y)}

INDEX COMPARISON
-------------
Index:           ${data.indexSymbol}
Premium/Disc:    ${formatters.percent(data.premium)}
Correlation:     ${formatters.number(data.correlation)}
R-Squared:       ${formatters.percent(data.rSquared)}`;
  },

  FACTOR: async (symbol) => {
    const data = await dataAggregator.getETFFactors(symbol);
    return `
FACTOR EXPOSURE FOR ${symbol}
-------------------------
STYLE FACTORS
-----------
Size:            ${formatters.number(data.size)}
Value:           ${formatters.number(data.value)}
Momentum:        ${formatters.number(data.momentum)}
Quality:         ${formatters.number(data.quality)}
Volatility:      ${formatters.number(data.volatility)}

SIGNIFICANCE
----------
Primary:         ${data.primaryFactor}
Secondary:       ${data.secondaryFactor}
Style Bias:      ${data.styleBias}`;
  },

  TAX: async (symbol) => {
    const data = await dataAggregator.getETFTax(symbol);
    return `
TAX ANALYSIS FOR ${symbol}
-----------------------
EFFICIENCY
--------
Tax Cost Ratio:  ${formatters.percent(data.taxCostRatio)}
Tax Efficiency:  ${formatters.percent(data.taxEfficiency)}
Turnover:        ${formatters.percent(data.turnover)}

DISTRIBUTION
----------
Qualified Div:   ${formatters.percent(data.qualifiedDividends)}
Return of Cap:   ${formatters.percent(data.returnOfCapital)}
Cap Gains:       ${formatters.percent(data.capitalGains)}`;
  },

  LIQUID: async (symbol) => {
    const data = await dataAggregator.getETFLiquidity(symbol);
    return `
LIQUIDITY ANALYSIS FOR ${symbol}
----------------------------
TRADING METRICS
-------------
Spread:          ${formatters.percent(data.spread)}
Avg Trade Size:  ${formatters.number(data.avgTradeSize)}
Block Liquidity: ${formatters.largeNumber(data.blockLiquidity)}

CREATION/REDEMPTION
----------------
Block Size:      ${formatters.number(data.creationUnit)}
Lead Time:       ${data.leadTime}
Auth. Parts:     ${formatters.number(data.authorizedParticipants)}`;
  }
};

export default etfCommands; 