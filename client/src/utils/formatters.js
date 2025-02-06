export const formatPrice = (num) => {
  if (!num || isNaN(num)) return 'N/A';
  return `$${Number(num).toFixed(2)}`;
};

export const formatNumber = (num) => {
  if (!num || isNaN(num)) return 'N/A';
  return new Intl.NumberFormat().format(num);
};

export const formatLargeNumber = (num) => {
  if (!num) return 'N/A';
  
  const trillion = 1000000000000;
  const billion = 1000000000;
  const million = 1000000;
  
  if (num >= trillion) {
    return `${(num / trillion).toFixed(2)}T`;
  } else if (num >= billion) {
    return `${(num / billion).toFixed(2)}B`;
  } else if (num >= million) {
    return `${(num / million).toFixed(2)}M`;
  }
  
  return num.toLocaleString();
};

export const formatPercent = (num) => {
  if (!num || isNaN(num)) return 'N/A';
  return `${Number(num).toFixed(2)}%`;
};

export const formatBillions = (num) => {
  if (!num || isNaN(num)) return 'N/A';
  return Number(num).toFixed(1);
};

export const formatMillions = (num) => {
  if (!num || isNaN(num)) return 'N/A';
  return Number(num).toFixed(1);
};

export const formatSentiment = (news) => {
  if (!news || !news.sentiment) return 'N/A';
  
  const score = news.sentiment.score || 0;
  const confidence = news.sentiment.confidence || 0;
  
  if (confidence < 0.5) return '⚪ Neutral (Low Confidence)';
  if (score > 0.3) return '🟢 Positive';
  if (score < -0.3) return '🔴 Negative';
  return '⚪ Neutral';
};

export const formatNews = (news) => {
  if (!news?.length) return 'No recent news available';
  
  return news.map(item => `
[${new Date(item.publishedAt).toLocaleDateString()}] ${item.source.name}
${item.title}
${item.description ? item.description.slice(0, 150) + '...' : 'No description available'}
${formatSentiment(item)}
URL: ${item.url}
`).join('\n---\n');
};

export const formatters = {
  price: (value) => value ? `$${Number(value).toFixed(2)}` : 'N/A',
  number: (value) => value ? Number(value).toLocaleString() : 'N/A',
  percent: (value) => value ? `${(Number(value) * 100).toFixed(2)}%` : 'N/A',
  largeNumber: (value) => {
    if (!value) return 'N/A';
    const num = Number(value);
    if (num >= 1e12) return `$${(num / 1e12).toFixed(2)}T`;
    if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
    return `$${num.toLocaleString()}`;
  },
  billions: formatBillions,
  millions: formatMillions,
  sentiment: formatSentiment,
  news: formatNews,
  fundamentalAnalysis: (data) => {
    if (!data) return 'No fundamental data available';
    return `
VALUATION
---------
P/E Ratio:       ${formatPrice(data.peRatio)}
P/B Ratio:       ${formatPrice(data.pbRatio)}
EV/EBITDA:       ${formatPrice(data.evEbitda)}
Market Cap:      ${formatLargeNumber(data.marketCap)}

PROFITABILITY
------------
Gross Margin:    ${formatPercent(data.grossMargin)}
Operating Margin:${formatPercent(data.operatingMargin)}
Net Margin:      ${formatPercent(data.netMargin)}
ROE:             ${formatPercent(data.roe)}
ROA:             ${formatPercent(data.roa)}`;
  },
  volumeAnalysis: (data) => {
    if (!data) return 'No volume data available';
    return `
VOLUME METRICS
-------------
Current Volume:  ${formatNumber(data.volume)}
Avg Volume:      ${formatNumber(data.avgVolume)}
Relative Volume: ${formatNumber(data.relativeVolume)}x
Volume Trend:    ${data.volumeTrend}`;
  },
  optionsChain: (data) => {
    if (!data) return 'No options data available';
    return `
CALLS                          PUTS
-----                          ----
Strike  IV    Bid   Ask        IV    Bid   Ask
${data.calls.map((call, i) => {
  const put = data.puts[i];
  return `${formatPrice(call.strike).padEnd(8)} ` +
         `${formatPercent(call.iv).padEnd(6)} ` +
         `${formatPrice(call.bid).padEnd(6)} ` +
         `${formatPrice(call.ask).padEnd(8)} ` +
         `${formatPercent(put.iv).padEnd(6)} ` +
         `${formatPrice(put.bid).padEnd(6)} ` +
         `${formatPrice(put.ask)}`;
}).join('\n')}`;
  },
  greeks: (data) => {
    if (!data) return 'No Greeks data available';
    return `
FIRST ORDER GREEKS
----------------
Delta:    ${formatNumber(data.delta)}
Gamma:    ${formatNumber(data.gamma)}
Theta:    ${formatNumber(data.theta)}
Vega:     ${formatNumber(data.vega)}
Rho:      ${formatNumber(data.rho)}

SECOND ORDER GREEKS
-----------------
Charm:    ${formatNumber(data.charm)}
Vanna:    ${formatNumber(data.vanna)}
Volga:    ${formatNumber(data.volga)}`;
  },
  forexRate: (data) => {
    if (!data) return 'No forex data available';
    return `
EXCHANGE RATE
------------
Rate:     ${formatNumber(data.rate)}
Change:   ${formatNumber(data.change)} (${formatPercent(data.percentChange)})
Bid:      ${formatNumber(data.bid)}
Ask:      ${formatNumber(data.ask)}`;
  },
  cryptoMarket: (data) => {
    if (!data) return 'No crypto market data available';
    return `
MARKET DATA
----------
Price:            ${formatPrice(data.price)}
Market Cap:       ${formatLargeNumber(data.marketCap)}
24h Volume:       ${formatLargeNumber(data.volume)}
Circulating:      ${formatNumber(data.circulatingSupply)}
Total Supply:     ${formatNumber(data.totalSupply)}`;
  },
  bondYield: (data) => {
    if (!data) return 'No bond data available';
    return `
YIELD DATA
---------
YTM:              ${formatPercent(data.ytm)}
Current Yield:    ${formatPercent(data.currentYield)}
Duration:         ${formatNumber(data.duration)}
Convexity:        ${formatNumber(data.convexity)}`;
  },
  etfHoldings: (data) => {
    if (!data?.holdings) return 'No holdings data available';
    return `
TOP HOLDINGS
-----------
${data.holdings.slice(0, 10).map(holding => 
  `${holding.symbol.padEnd(6)} ${holding.name.slice(0, 20).padEnd(20)} ${formatPercent(holding.weight)}`
).join('\n')}

CONCENTRATION
-----------
Top 10:          ${formatPercent(data.concentrationTop10)}
Top 25:          ${formatPercent(data.concentrationTop25)}`;
  },
  etfPerformance: (data) => {
    if (!data) return 'No performance data available';
    return `
PERFORMANCE
----------
1-Month:         ${formatPercent(data.return1M)}
3-Month:         ${formatPercent(data.return3M)}
YTD:             ${formatPercent(data.returnYTD)}
1-Year:          ${formatPercent(data.return1Y)}`;
  }
};

export const {
  price,
  number,
  percent,
  largeNumber,
  billions,
  millions,
  sentiment,
  news,
  fundamentalAnalysis,
  volumeAnalysis,
  optionsChain,
  greeks,
  forexRate,
  cryptoMarket,
  bondYield,
  etfHoldings,
  etfPerformance
} = formatters;

export default formatters; 