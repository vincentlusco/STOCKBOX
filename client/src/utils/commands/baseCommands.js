import { formatPrice, formatNumber, formatPercent, formatLargeNumber } from '../formatters';

// Common formatting utilities used across all command types
export const formatters = {
  price: formatPrice,
  number: formatNumber,
  percent: formatPercent,
  largeNumber: formatLargeNumber
};

// Base commands available to all security types
export const baseCommands = {
  HELP: (symbol, type) => {
    return getCommandHelp(type);
  },

  CLEAR: () => {
    return '';
  },

  CLS: () => {
    return '';
  },

  PRICE: (symbol, data) => {
    const { quote } = data;
    if (!quote?.price) {
      throw new Error('Price data not available');
    }

    const { price, trading, market } = quote;
    
    return `
PRICE DATA FOR ${symbol}
-------------------------
Current:     ${formatters.price(price.current, symbol)}
Change:      ${price.change ? `${formatters.price(price.change)} (${formatters.percent(price.changePercent)})` : 'N/A'}
Volume:      ${formatters.number(price.volume)}
Avg Volume:  ${formatters.number(market?.avgVolume)}
Vol/Avg:     ${price.volume && market?.avgVolume ? formatters.percent(price.volume / market.avgVolume) : 'N/A'}

TRADING DATA
-----------
Day Range:   ${price.high && price.low ? `${formatters.price(price.low)} - ${formatters.price(price.high)}` : 'N/A'}
Open:        ${formatters.price(price.open)}
Prev Close:  ${formatters.price(price.previousClose)}
Bid/Ask:     ${trading?.bid && trading?.ask ? `${formatters.price(trading.bid)}/${formatters.price(trading.ask)}` : 'N/A'}`;
  },

  TECH: (symbol, data) => {
    const { technical: tech } = data;
    if (!tech) {
      throw new Error('Technical data not available');
    }

    return `
TECHNICAL ANALYSIS FOR ${symbol}
--------------------------------
RSI (14):    ${tech.rsi.toFixed(2)}
MACD:        ${tech.macd.macd.toFixed(2)}
Signal:      ${tech.macd.signal.toFixed(2)}
Histogram:   ${tech.macd.histogram.toFixed(2)}

MOVING AVERAGES
--------------
SMA 20:      ${tech.sma20.toFixed(2)}
SMA 50:      ${tech.sma50.toFixed(2)}
SMA 200:     ${tech.sma200.toFixed(2)}

BOLLINGER BANDS
--------------
Upper:       ${tech.bollinger.upper.toFixed(2)}
Middle:      ${tech.bollinger.middle.toFixed(2)}
Lower:       ${tech.bollinger.lower.toFixed(2)}

VOLUME ANALYSIS
--------------
Current:     ${formatters.number(tech.volume)}
Average:     ${formatters.number(tech.avgVolume)}
Change:      ${formatters.percent(tech.volumeChange)}`;
  },

  NEWS: (symbol, data) => {
    const { news } = data;
    if (!news?.length) {
      throw new Error('No news available');
    }

    return news.map(item => `
[${new Date(item.publishedAt).toLocaleDateString()}] ${item.source.name}
${item.title}
${item.description ? item.description.slice(0, 150) + '...' : 'No description available'}
URL: ${item.url}
`).join('\n---\n');
  }
};

export default baseCommands; 