import baseCommands from './baseCommands';
import { formatters } from './formatters';
import { formatPrice, formatNumber, formatPercent, formatLargeNumber } from '../formatters';
import { calculateTechnicals } from '../technicalAnalysis';
import { dataAggregator } from '../../services/dataAggregator';
import { marketData } from '../../services/marketData';

export const stockCommands = {
  ...baseCommands,

  FA: async (symbol) => {
    const data = await dataAggregator.getFundamentals(symbol);
    return `
FUNDAMENTAL ANALYSIS FOR ${symbol}
------------------------------
VALUATION METRICS
--------------
P/E Ratio:       ${formatters.number(data.metrics.peRatio)}
P/B Ratio:       ${formatters.number(data.metrics.pbRatio)}
EV/EBITDA:       ${formatters.number(data.metrics.enterpriseValueOverEBITDA)}
Market Cap:      ${formatters.largeNumber(data.profile.mktCap)}

PROFITABILITY
-----------
Profit Margin:   ${formatters.percent(data.metrics.netProfitMargin)}
ROE:             ${formatters.percent(data.metrics.roe)}
ROA:             ${formatters.percent(data.metrics.roa)}
ROIC:            ${formatters.percent(data.metrics.roic)}

FINANCIAL HEALTH
-------------
Current Ratio:   ${formatters.number(data.metrics.currentRatio)}
Debt/Equity:     ${formatters.number(data.metrics.debtToEquity)}
Quick Ratio:     ${formatters.number(data.metrics.quickRatio)}
Interest Cover:  ${formatters.number(data.metrics.interestCoverage)}`;
  },

  DIV: async (symbol) => {
    const data = await dataAggregator.getDividendData(symbol);
    if (!data.dividends) {
      throw new Error('Dividend data not available');
    }

    const div = data.dividends;
    
    return `
DIVIDEND DATA FOR ${symbol}
-------------------------
Dividend Yield:  ${formatters.percent(div.yield)}
Annual Payout:   ${formatters.price(div.annualPayout)}
Payout Ratio:    ${formatters.percent(div.payoutRatio)}
Ex-Date:         ${div.exDate || 'N/A'}
Pay Date:        ${div.payDate || 'N/A'}

DIVIDEND HISTORY
---------------
${div.history?.map(d => 
  `${d.date}: ${formatters.price(d.amount)}`
).join('\n') || 'No dividend history available'}`;
  },

  PRICE: async (symbol) => {
    const data = await dataAggregator.getStockQuote(symbol);
    return `
STOCK PRICE DATA FOR ${symbol}
--------------------------
CURRENT TRADING
-------------
Price:           ${formatters.price(data.c || data.regularMarketPrice)}
Change:          ${formatters.price(data.d || data.regularMarketChange)} (${formatters.percent(data.dp || data.regularMarketChangePercent)})
Volume:          ${formatters.number(data.v || data.regularMarketVolume)}

TRADING RANGE
-----------
Day High:        ${formatters.price(data.h || data.regularMarketDayHigh)}
Day Low:         ${formatters.price(data.l || data.regularMarketDayLow)}
Open:            ${formatters.price(data.o || data.regularMarketOpen)}`;
  },

  VOL: async (symbol, data) => {
    const { quote } = data;
    if (!quote?.regularMarketVolume) throw new Error('Volume data not available');
    
    return `
VOLUME ANALYSIS FOR ${symbol}
--------------------------
CURRENT VOLUME
------------
Today:           ${formatters.number(quote.regularMarketVolume)}
Avg (3M):        ${formatters.number(quote.averageDailyVolume3Month)}
Avg (10D):       ${formatters.number(quote.averageDailyVolume10Day)}

RELATIVE VOLUME
-------------
vs 3M Avg:       ${formatters.percent(quote.regularMarketVolume / quote.averageDailyVolume3Month - 1)}
vs 10D Avg:      ${formatters.percent(quote.regularMarketVolume / quote.averageDailyVolume10Day - 1)}`;
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

  NEWS: async (symbol) => {
    const articles = await dataAggregator.getNews(symbol);
    return articles.map(article => `
[${new Date(article.publishedAt).toLocaleDateString()}] ${article.source.name}
${article.title}
${article.description ? article.description.slice(0, 150) + '...' : 'No description available'}
URL: ${article.url}
`).join('\n---\n');
  },

  EARN: async (symbol, data) => {
    const { earnings } = data;
    if (!earnings) throw new Error('Earnings data not available');
    
    return `
EARNINGS DATA FOR ${symbol}
------------------------
NEXT EARNINGS
------------
Report Date:     ${earnings.earningsDate?.[0] ? new Date(earnings.earningsDate[0]).toLocaleDateString() : 'N/A'}
Est. EPS:        ${formatters.price(earnings.earningsEstimate?.avg)}

PREVIOUS QUARTER
--------------
EPS:             ${formatters.price(earnings.earningsHistory?.[0]?.epsActual)}
Est:             ${formatters.price(earnings.earningsHistory?.[0]?.epsEstimate)}
Surprise:        ${formatters.percent(earnings.earningsHistory?.[0]?.surprisePercent)}`;
  },

  INST: async (symbol) => {
    const data = await dataAggregator.getInstitutionalHoldings(symbol);
    return `
INSTITUTIONAL HOLDINGS FOR ${symbol}
--------------------------------
TOP HOLDERS
----------
${data.holders.slice(0, 5).map(holder => `
${holder.name.padEnd(30)}
Shares: ${formatters.number(holder.shares)}
Value:  ${formatters.largeNumber(holder.value)}
Change: ${formatters.percent(holder.change)}`).join('\n')}

OWNERSHIP SUMMARY
--------------
Institutional:   ${formatters.percent(data.institutionalOwnership)}
Insider:         ${formatters.percent(data.insiderOwnership)}
Retail:          ${formatters.percent(1 - data.institutionalOwnership - data.insiderOwnership)}`;
  },

  INSID: (symbol, data) => {
    const { insider } = data;
    if (!insider) throw new Error('Insider trading data not available');
    
    return `
INSIDER TRADING FOR ${symbol}
---------------------------
RECENT TRANSACTIONS
-----------------
${insider.transactions.map(t => `
${t.date} - ${t.name} (${t.title})
Type: ${t.type}
Shares: ${formatters.number(t.shares)}
Price: ${formatters.price(t.price)}
Value: ${formatters.largeNumber(t.value)}`
).join('\n')}

SUMMARY
-------
3M Net Shares:     ${formatters.number(insider.threeMonthNet)}
12M Net Shares:    ${formatters.number(insider.twelveMonthNet)}
Insider Own %:     ${formatters.percent(insider.ownershipPercent)}`;
  },

  PEER: (symbol, data) => {
    const { peers } = data;
    if (!peers) throw new Error('Peer comparison data not available');
    
    return `
PEER COMPARISON FOR ${symbol}
---------------------------
VALUATION METRICS
---------------
${peers.companies.map(p => `
${p.symbol.padEnd(6)} ${p.name.slice(0, 20).padEnd(20)}
P/E:  ${(p.peRatio || 'N/A').toString().padStart(8)}
P/B:  ${(p.pbRatio || 'N/A').toString().padStart(8)}
P/S:  ${(p.psRatio || 'N/A').toString().padStart(8)}
EV/EBITDA: ${(p.evEbitda || 'N/A').toString().padStart(8)}`
).join('\n')}

PERFORMANCE
----------
${peers.companies.map(p => `
${p.symbol.padEnd(6)}
1M:   ${formatters.percent(p.performance.oneMonth).padStart(8)}
3M:   ${formatters.percent(p.performance.threeMonth).padStart(8)}
YTD:  ${formatters.percent(p.performance.ytd).padStart(8)}
1Y:   ${formatters.percent(p.performance.oneYear).padStart(8)}`
).join('\n')}`;
  },

  EST: (symbol, data) => {
    const { estimates } = data;
    if (!estimates) throw new Error('Analyst estimates not available');
    
    return `
ANALYST ESTIMATES FOR ${symbol}
-----------------------------
CONSENSUS RECOMMENDATION
----------------------
Rating:          ${estimates.rating}
Target Price:    ${formatters.price(estimates.targetPrice)}
High Target:     ${formatters.price(estimates.highTarget)}
Low Target:      ${formatters.price(estimates.lowTarget)}
# of Analysts:   ${estimates.numAnalysts}

EPS ESTIMATES
-----------
Current Q:      ${formatters.price(estimates.currentQuarterEps)}
Next Q:         ${formatters.price(estimates.nextQuarterEps)}
Current Y:      ${formatters.price(estimates.currentYearEps)}
Next Y:         ${formatters.price(estimates.nextYearEps)}
Growth Rate:    ${formatters.percent(estimates.growthRate)}`;
  },

  RISK: (symbol, data) => {
    const { risk } = data;
    if (!risk) throw new Error('Risk metrics not available');
    
    return `
RISK ANALYSIS FOR ${symbol}
-------------------------
VOLATILITY METRICS
----------------
Beta:            ${risk.beta?.toFixed(2) || 'N/A'}
Daily Vol:       ${formatters.percent(risk.dailyVolatility)}
Monthly Vol:     ${formatters.percent(risk.monthlyVolatility)}
R-Squared:       ${formatters.percent(risk.rSquared)}

RISK METRICS
----------
Sharpe Ratio:    ${risk.sharpeRatio?.toFixed(2) || 'N/A'}
Sortino Ratio:   ${risk.sortinoRatio?.toFixed(2) || 'N/A'}
Max Drawdown:    ${formatters.percent(risk.maxDrawdown)}
VaR (95%):       ${formatters.percent(risk.valueAtRisk)}`;
  },

  FLOW: (symbol, data) => {
    const { flow } = data;
    if (!flow) throw new Error('Flow data not available');
    
    return `
MONEY FLOW FOR ${symbol}
----------------------
BUYING/SELLING PRESSURE
---------------------
Money Flow Index: ${flow.mfi?.toFixed(2) || 'N/A'}
Chaikin MF:      ${flow.chaikinMf?.toFixed(2) || 'N/A'}
On Balance Vol:   ${formatters.number(flow.obv)}

INSTITUTIONAL FLOWS
-----------------
Net Flow 1M:     ${formatters.largeNumber(flow.netFlow1M)}
Net Flow 3M:     ${formatters.largeNumber(flow.netFlow3M)}
Net Flow YTD:    ${formatters.largeNumber(flow.netFlowYtd)}`;
  },

  SHORT: (symbol, data) => {
    const { short } = data;
    if (!short) throw new Error('Short interest data not available');
    
    return `
SHORT INTEREST FOR ${symbol}
--------------------------
Current SI:       ${formatters.number(short.sharesShort)}
Prior SI:        ${formatters.number(short.sharesShortPrior)}
% Float Short:   ${formatters.percent(short.shortPercent)}
Days to Cover:   ${short.daysToCover?.toFixed(1) || 'N/A'}

BORROWING DATA
------------
Fee Rate:        ${formatters.percent(short.feeRate)}
Shares Avail:    ${formatters.number(short.sharesAvailable)}
Utilization:     ${formatters.percent(short.utilization)}`;
  },

  DES: async (symbol, data) => {
    const { assetProfile } = data;
    if (!assetProfile) throw new Error('Company description not available');
    
    return `
COMPANY DESCRIPTION FOR ${symbol}
-----------------------------
${assetProfile.longBusinessSummary}

DETAILS
-------
Sector:          ${assetProfile.sector}
Industry:        ${assetProfile.industry}
Employees:       ${formatters.number(assetProfile.fullTimeEmployees)}
Website:         ${assetProfile.website}`;
  },

  FIN: async (symbol) => {
    const data = await dataAggregator.getFinancials(symbol);
    if (!data.financials) throw new Error('Financial data not available');
    
    return `
FINANCIAL SUMMARY FOR ${symbol}
----------------------------
INCOME STATEMENT (TTM)
--------------------
Revenue:         ${formatters.largeNumber(data.financials.revenue)}
Gross Profit:    ${formatters.largeNumber(data.financials.grossProfit)}
Net Income:      ${formatters.largeNumber(data.financials.netIncome)}
EPS:             ${formatters.price(data.financials.eps)}

BALANCE SHEET
-----------
Cash:            ${formatters.largeNumber(data.financials.totalCash)}
Debt:            ${formatters.largeNumber(data.financials.totalDebt)}
Assets:          ${formatters.largeNumber(data.financials.totalAssets)}
Equity:          ${formatters.largeNumber(data.financials.stockholdersEquity)}

METRICS
------
Current Ratio:   ${formatters.number(data.financials.currentRatio)}
Debt/Equity:     ${formatters.number(data.financials.debtToEquity)}
ROE:             ${formatters.percent(data.financials.returnOnEquity)}
ROA:             ${formatters.percent(data.financials.returnOnAssets)}`;
  },

  GROWTH: async (symbol, data) => {
    const { growth } = data;
    if (!growth) throw new Error('Growth data not available');
    
    return `
GROWTH METRICS FOR ${symbol}
-------------------------
YEAR OVER YEAR
------------
Revenue Growth:   ${formatters.percent(growth.revenueGrowthYOY)}
Profit Growth:    ${formatters.percent(growth.profitGrowthYOY)}
EPS Growth:       ${formatters.percent(growth.epsGrowthYOY)}
Quarterly Growth: ${formatters.percent(growth.quarterlyGrowth)}`;
  },

  MARGIN: async (symbol, data) => {
    const { margins } = data;
    if (!margins) throw new Error('Margin data not available');
    
    return `
MARGIN ANALYSIS FOR ${symbol}
--------------------------
PROFITABILITY
------------
Gross Margin:     ${formatters.percent(margins.grossMargin)}
Operating Margin: ${formatters.percent(margins.operatingMargin)}
Net Margin:       ${formatters.percent(margins.netMargin)}
EBITDA Margin:    ${formatters.percent(margins.ebitdaMargin)}`;
  },

  SECTOR: async (symbol, data) => {
    const { sector } = data;
    if (!sector) throw new Error('Sector data not available');
    
    return `
SECTOR ANALYSIS FOR ${symbol}
--------------------------
PEER COMPARISON
-------------
${sector.peers.map((peer, i) => `
${peer.symbol.padEnd(6)} ${peer.name.slice(0, 20).padEnd(20)}
P/E:     ${formatters.number(sector.metrics[i].peRatio)}
P/B:     ${formatters.number(sector.metrics[i].pbRatio)}
ROE:     ${formatters.percent(sector.metrics[i].roe)}
MARGIN:  ${formatters.percent(sector.metrics[i].netMargin)}`
).join('\n')}`;
  },

  ESG: async (symbol, data) => {
    const { esg } = data;
    if (!esg) throw new Error('ESG data not available');
    
    return `
ESG RATINGS FOR ${symbol}
----------------------
ENVIRONMENTAL
-----------
Score:           ${formatters.number(esg.environmentalScore)}
Grade:           ${esg.environmentalGrade}
Factors:         ${esg.environmentalFactors.join(', ')}

SOCIAL
-----
Score:           ${formatters.number(esg.socialScore)}
Grade:           ${esg.socialGrade}
Factors:         ${esg.socialFactors.join(', ')}

GOVERNANCE
---------
Score:           ${formatters.number(esg.governanceScore)}
Grade:           ${esg.governanceGrade}
Factors:         ${esg.governanceFactors.join(', ')}

OVERALL
------
Total Score:     ${formatters.number(esg.totalScore)}
Rating:          ${esg.rating}`;
  },

  SEC: async (symbol, data) => {
    const { secFilings } = data;
    if (!secFilings) throw new Error('SEC filing data not available');
    
    return `
RECENT SEC FILINGS FOR ${symbol}
----------------------------
${secFilings.map(filing => `
Type: ${filing.type}
Date: ${new Date(filing.filingDate).toLocaleDateString()}
Desc: ${filing.description}
Link: ${filing.link}`
).join('\n')}`;
  },

  SPLIT: async (symbol, data) => {
    const { splitHistory } = data;
    if (!splitHistory) throw new Error('Split history not available');
    
    return `
STOCK SPLIT HISTORY FOR ${symbol}
-----------------------------
${splitHistory.map(split => `
Date: ${new Date(split.date).toLocaleDateString()}
Ratio: ${split.ratio}
Before: ${formatters.price(split.beforePrice)}
After: ${formatters.price(split.afterPrice)}`
).join('\n')}`;
  },

  MGMT: async (symbol, data) => {
    const { management } = data;
    if (!management) throw new Error('Management data not available');
    
    return `
MANAGEMENT TEAM FOR ${symbol}
-------------------------
${management.map(exec => `
Name: ${exec.name}
Title: ${exec.title}
Age: ${exec.age}
Since: ${exec.yearStarted}
Comp: ${formatters.largeNumber(exec.totalCompensation)}`
).join('\n')}`;
  },

  RATIO: async (symbol, data) => {
    const { ratios } = data;
    if (!ratios) throw new Error('Ratio data not available');
    
    return `
FINANCIAL RATIOS FOR ${symbol}
---------------------------
VALUATION
---------
P/E:             ${formatters.number(ratios.peRatio)}
P/B:             ${formatters.number(ratios.pbRatio)}
P/S:             ${formatters.number(ratios.psRatio)}
EV/EBITDA:       ${formatters.number(ratios.evToEbitda)}

EFFICIENCY
---------
ROE:             ${formatters.percent(ratios.roe)}
ROA:             ${formatters.percent(ratios.roa)}
Asset Turnover:  ${formatters.number(ratios.assetTurnover)}

LIQUIDITY
--------
Current Ratio:   ${formatters.number(ratios.currentRatio)}
Quick Ratio:     ${formatters.number(ratios.quickRatio)}`;
  },

  TREND: async (symbol, data) => {
    const { trend } = data;
    if (!trend) throw new Error('Trend data not available');
    
    return `
PRICE TREND ANALYSIS FOR ${symbol}
------------------------------
MOVING AVERAGES
-------------
SMA(20):         ${formatters.price(trend.sma20)}
SMA(50):         ${formatters.price(trend.sma50)}
SMA(200):        ${formatters.price(trend.sma200)}

TREND SIGNALS
-----------
Direction:       ${trend.direction}
Strength:        ${trend.strength}
ADX:             ${formatters.number(trend.adx)}`;
  },

  PIVOT: async (symbol, data) => {
    const { pivots } = data;
    if (!pivots) throw new Error('Pivot point data not available');
    
    return `
PIVOT POINTS FOR ${symbol}
-----------------------
PIVOT POINT:      ${formatters.price(pivots.pivotPoint)}

RESISTANCE
---------
R1:              ${formatters.price(pivots.resistance.r1)}
R2:              ${formatters.price(pivots.resistance.r2)}
R3:              ${formatters.price(pivots.resistance.r3)}

SUPPORT
------
S1:              ${formatters.price(pivots.support.s1)}
S2:              ${formatters.price(pivots.support.s2)}
S3:              ${formatters.price(pivots.support.s3)}`;
  }
};

export default stockCommands;

// Helper functions
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