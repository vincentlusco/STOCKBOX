import baseCommands from './baseCommands';
import { formatters } from './formatters';
import { formatPrice, formatNumber, formatPercent, formatLargeNumber } from '../formatters';
import { dataAggregator } from '../../services/dataAggregator';
import { marketData } from '../../services/marketData';

const { formatBlockchainData } = formatters;

export const cryptoCommands = {
  ...baseCommands,

  PRICE: async (symbol) => {
    const data = await dataAggregator.getCryptoQuote(symbol);
    return `
CRYPTO PRICE DATA FOR ${symbol}
----------------------------
CURRENT TRADING
-------------
Price:           ${formatters.price(data.lastPrice)}
24h Change:      ${formatters.price(data.priceChange)} (${formatters.percent(data.priceChangePercent)})
24h Volume:      ${formatters.largeNumber(data.volume)} ${symbol.split('-')[0]}
Quote Volume:    ${formatters.largeNumber(data.quoteVolume)} USD

TRADING RANGE
-----------
24h High:        ${formatters.price(data.highPrice)}
24h Low:         ${formatters.price(data.lowPrice)}
Weighted Avg:    ${formatters.price(data.weightedAvgPrice)}`;
  },

  VOL: async (symbol) => {
    const data = await dataAggregator.getCryptoVolume(symbol);
    return `
VOLUME ANALYSIS FOR ${symbol}
--------------------------
24H VOLUME
--------
Base Volume:     ${formatters.largeNumber(data.volume)} ${symbol.split('-')[0]}
Quote Volume:    ${formatters.largeNumber(data.quoteVolume)} USD
Trade Count:     ${formatters.number(data.count)} trades

TRADING METRICS
------------
Avg Trade Size:  ${formatters.number(data.volume / data.count)} ${symbol.split('-')[0]}
Quote per Trade: ${formatters.price(data.quoteVolume / data.count)}
Volume/Price:    ${formatters.number(data.volume / data.lastPrice)}`;
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

  DEPTH: async (symbol) => {
    const data = await dataAggregator.getCryptoDepth(symbol);
    return `
ORDER BOOK FOR ${symbol}
---------------------
TOP BIDS
-------
${data.bids.slice(0, 5).map(bid => 
  `${formatters.price(bid[0]).padStart(10)} | ${formatters.number(bid[1])} ${symbol.split('-')[0]}`
).join('\n')}

TOP ASKS
-------
${data.asks.slice(0, 5).map(ask => 
  `${formatters.price(ask[0]).padStart(10)} | ${formatters.number(ask[1])} ${symbol.split('-')[0]}`
).join('\n')}

BOOK SUMMARY
----------
Spread:          ${formatters.price(data.asks[0][0] - data.bids[0][0])}
Spread %:        ${formatters.percent((data.asks[0][0] - data.bids[0][0]) / data.asks[0][0])}
Total Bid Vol:   ${formatters.number(data.bids.reduce((sum, bid) => sum + bid[1], 0))}
Total Ask Vol:   ${formatters.number(data.asks.reduce((sum, ask) => sum + ask[1], 0))}`;
  },

  TRADE: async (symbol) => {
    const data = await dataAggregator.getCryptoTrades(symbol);
    return `
RECENT TRADES FOR ${symbol}
------------------------
LAST 5 TRADES
-----------
${data.trades.slice(0, 5).map(trade => `
Time: ${new Date(trade.time).toLocaleTimeString()}
Price: ${formatters.price(trade.price)}
Size: ${formatters.number(trade.qty)} ${symbol.split('-')[0]}
Side: ${trade.isBuyerMaker ? 'SELL' : 'BUY'}`
).join('\n')}

TRADE SUMMARY
-----------
Avg Price:       ${formatters.price(data.avgPrice)}
Total Volume:    ${formatters.number(data.totalVolume)}
Buy Volume:      ${formatters.number(data.buyVolume)}
Sell Volume:     ${formatters.number(data.sellVolume)}`;
  },

  CHAIN: async (symbol) => {
    const data = await marketData.getSecurityData(symbol, 'CRYPTO', 'CHAIN');
    return formatBlockchainData(data);
  },

  MARKET: async (symbol) => {
    const data = await dataAggregator.getCryptoMarket(symbol);
    return `
MARKET DATA FOR ${symbol}
----------------------
SUPPLY METRICS
------------
Circulating:     ${formatters.number(data.circulatingSupply)}
Total Supply:    ${formatters.number(data.totalSupply)}
Max Supply:      ${formatters.number(data.maxSupply)}

MARKET METRICS
------------
Market Cap:      ${formatters.largeNumber(data.marketCap)}
24h Volume:      ${formatters.largeNumber(data.totalVolume)}
# of Markets:    ${formatters.number(data.numberOfMarkets)}
# of Exchanges:  ${formatters.number(data.numberOfExchanges)}`;
  },

  DEFI: async (symbol) => {
    const data = await dataAggregator.getCryptoDeFi(symbol);
    return `
DEFI METRICS FOR ${symbol}
------------------------
LIQUIDITY
--------
Total TVL:       ${formatters.largeNumber(data.tvl)}
24h Change:      ${formatters.percent(data.tvlChange24h)}
Protocol Share:  ${formatters.percent(data.marketShare)}

YIELD FARMING
-----------
Pools:           ${formatters.number(data.poolCount)}
Best APY:        ${formatters.percent(data.bestApy)}
Avg APY:         ${formatters.percent(data.avgApy)}
Total Staked:    ${formatters.largeNumber(data.totalStaked)}

LENDING METRICS
------------
Total Borrowed:  ${formatters.largeNumber(data.totalBorrowed)}
Collateral:      ${formatters.largeNumber(data.totalCollateral)}
Utilization:     ${formatters.percent(data.utilization)}
Lending Rate:    ${formatters.percent(data.lendingRate)}`;
  },

  NFT: async (symbol) => {
    const data = await dataAggregator.getCryptoNFT(symbol);
    return `
NFT ECOSYSTEM FOR ${symbol}
------------------------
MARKET ACTIVITY
-------------
Collections:     ${formatters.number(data.totalCollections)}
24h Volume:      ${formatters.largeNumber(data.volume24h)}
Avg Price:       ${formatters.price(data.avgPrice24h)}
Sales Count:     ${formatters.number(data.salesCount24h)}

TOP COLLECTION
------------
Name:            ${data.topCollection.name}
Floor Price:     ${formatters.price(data.topCollection.floorPrice)}
Market Cap:      ${formatters.largeNumber(data.topCollection.marketCap)}
Owners:          ${formatters.number(data.topCollection.owners)}`;
  },

  SUPPLY: (symbol, data) => {
    const { supply } = data;
    if (!supply) throw new Error('Supply data not available');
    
    return `
SUPPLY METRICS FOR ${symbol}
--------------------------
CURRENT SUPPLY
------------
Circulating:     ${formatters.number(supply.circulating)} ${symbol}
Total:           ${formatters.number(supply.total)} ${symbol}
Max:             ${formatters.number(supply.max) || 'Unlimited'} ${symbol}

DISTRIBUTION
----------
Top 10 Holders:  ${formatters.percent(supply.top10Percent)}
Top 100 Holders: ${formatters.percent(supply.top100Percent)}
Active Supply:   ${formatters.percent(supply.activeSupply90d)}

ECONOMICS
-------
Inflation Rate:  ${formatters.percent(supply.inflationRate)}
Staked:          ${formatters.percent(supply.stakedPercent)}
Burned:          ${formatters.number(supply.burned)} ${symbol}`;
  },

  DES: (symbol, data) => {
    const { info } = data;
    if (!info) throw new Error('Asset information not available');
    
    return `
CRYPTO DESCRIPTION FOR ${symbol}
-----------------------------
Name:            ${info.name}
Category:        ${info.category}
Launch Date:     ${info.launchDate}
Consensus:       ${info.consensus}
Hash Algorithm:  ${info.algorithm}

OVERVIEW
--------
${info.description}

LINKS
-----
Website:     ${info.website}
Whitepaper:  ${info.whitepaper}
Github:      ${info.github}`;
  },

  EXCH: async (symbol) => {
    const data = await dataAggregator.getCryptoExchanges(symbol);
    return `
EXCHANGE DATA FOR ${symbol}
------------------------
TOP EXCHANGES BY VOLUME
--------------------
${data.exchanges.slice(0, 5).map(ex => `
${ex.name.padEnd(15)} ${formatters.largeNumber(ex.volume)}
Price:    ${formatters.price(ex.price)}
Premium:  ${formatters.percent(ex.premium)}`
).join('\n')}

ARBITRAGE
--------
Max Premium:     ${formatters.percent(data.maxPremium)}
Max Discount:    ${formatters.percent(data.maxDiscount)}
Arb Score:       ${formatters.number(data.arbScore)}`;
  },

  HASH: (symbol, data) => {
    const { mining } = data;
    if (!mining) throw new Error('Mining data not available');
    
    return `
MINING/STAKING STATS FOR ${symbol}
-------------------------------
NETWORK METRICS
-------------
Hash Rate:        ${formatters.number(mining.hashRate)} H/s
Difficulty:       ${formatters.number(mining.difficulty)}
Block Time:       ${mining.blockTime.toFixed(2)}s
Network Power:    ${mining.networkPower}

MINING ECONOMICS
-------------
Revenue 24h:      ${formatters.largeNumber(mining.revenue24h)}
Fees 24h:         ${formatters.largeNumber(mining.fees24h)}
Cost to Mine:     ${formatters.price(mining.miningCost)}
Break-even:       ${formatters.price(mining.breakEven)}`;
  },

  WHALE: async (symbol) => {
    const data = await dataAggregator.getCryptoWhales(symbol);
    return `
WHALE ACTIVITY FOR ${symbol}
-------------------------
WHALE METRICS
-----------
Active Whales:   ${formatters.number(data.activeWhales24h)}
Avg Transaction: ${formatters.largeNumber(data.avgWhaleTransaction)}
Inflow 24h:      ${formatters.largeNumber(data.inflow24h)}
Outflow 24h:     ${formatters.largeNumber(data.outflow24h)}

CONCENTRATION
-----------
Top 10 Holdings: ${formatters.percent(data.top10Concentration)}
Top 50 Holdings: ${formatters.percent(data.top50Concentration)}
Whale Score:     ${formatters.number(data.whaleScore)}/10`;
  },

  DEV: (symbol, data) => {
    const { development } = data;
    if (!development) throw new Error('Development data not available');
    
    return `
DEVELOPMENT ACTIVITY FOR ${symbol}
-------------------------------
GITHUB METRICS
------------
Commits (30d):    ${formatters.number(development.commits30d)}
Contributors:     ${formatters.number(development.contributors)}
Issues Open:      ${formatters.number(development.openIssues)}
Issues Closed:    ${formatters.number(development.closedIssues)}

DEVELOPMENT SCORE
--------------
Overall:          ${development.score.toFixed(2)}
Activity:         ${development.activityScore.toFixed(2)}
Community:        ${development.communityScore.toFixed(2)}`;
  },

  SOCIAL: (symbol, data) => {
    const { social } = data;
    if (!social) throw new Error('Social data not available');
    
    return `
SOCIAL SENTIMENT FOR ${symbol}
---------------------------
METRICS (24H)
-----------
Twitter Volume:   ${formatters.number(social.twitterVolume)}
Reddit Posts:     ${formatters.number(social.redditPosts)}
Telegram Users:   ${formatters.number(social.telegramUsers)}
Discord Members:  ${formatters.number(social.discordMembers)}

SENTIMENT
--------
Overall Score:    ${social.sentimentScore.toFixed(2)}
Bullish:         ${formatters.percent(social.bullishPercent)}
Bearish:         ${formatters.percent(social.bearishPercent)}
Neutral:         ${formatters.percent(social.neutralPercent)}`;
  },

  QUOTE: async (symbol) => {
    const data = await dataAggregator.getCryptoQuote(symbol);
    return `
CRYPTO QUOTE FOR ${symbol}
-----------------------
CURRENT TRADING
-------------
Price:           ${formatters.price(data.lastPrice)}
24h Change:      ${formatters.price(data.priceChange)} (${formatters.percent(data.priceChangePercent)})
24h Volume:      ${formatters.largeNumber(data.volume)} ${symbol.split('-')[0]}
Quote Volume:    ${formatters.largeNumber(data.quoteVolume)} USD

TRADING RANGE
-----------
24h High:        ${formatters.price(data.highPrice)}
24h Low:         ${formatters.price(data.lowPrice)}
Weighted Avg:    ${formatters.price(data.weightedAvgPrice)}`;
  },

  NETWORK: async (symbol) => {
    const data = await dataAggregator.getCryptoNetwork(symbol);
    return `
NETWORK HEALTH FOR ${symbol}
-------------------------
BLOCKCHAIN METRICS
---------------
TPS:             ${formatters.number(data.tps)}
Active Addresses: ${formatters.number(data.activeAddresses24h)}
Transactions 24h: ${formatters.number(data.transactions24h)}
Avg Fee:         ${formatters.price(data.avgFee24h)}

NETWORK SECURITY
-------------
Hash Rate:       ${formatters.largeNumber(data.hashRate)}H/s
Node Count:      ${formatters.number(data.nodeCount)}
Version:         ${data.latestVersion}
Consensus:       ${data.consensusHealth}%`;
  },

  GAS: async (symbol) => {
    const data = await dataAggregator.getCryptoGas(symbol);
    return `
GAS ANALYSIS FOR ${symbol}
-----------------------
CURRENT GAS
---------
Base Fee:        ${formatters.number(data.baseFee)} Gwei
Priority Fee:    ${formatters.number(data.priorityFee)} Gwei
Total Fee:       ${formatters.price(data.totalFee)} USD

STATISTICS
--------
24h Average:     ${formatters.number(data.average24h)} Gwei
24h Highest:     ${formatters.number(data.highest24h)} Gwei
24h Lowest:      ${formatters.number(data.lowest24h)} Gwei
Pending Txs:     ${formatters.number(data.pendingTxs)}`;
  },

  CONTRACT: async (symbol) => {
    const data = await dataAggregator.getCryptoContract(symbol);
    return `
CONTRACT ANALYSIS FOR ${symbol}
---------------------------
SECURITY
-------
Audit Score:     ${formatters.number(data.auditScore)}/100
Vulnerabilities: ${data.vulnerabilities}
Last Audit:      ${data.lastAudit}
Risk Level:      ${data.riskLevel}

ACTIVITY
-------
Interactions 24h: ${formatters.number(data.interactions24h)}
Unique Users 24h: ${formatters.number(data.uniqueUsers24h)}
Gas Used 24h:     ${formatters.largeNumber(data.gasUsed24h)}`;
  }
};

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

export default cryptoCommands; 