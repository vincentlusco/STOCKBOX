import React, { useState, useRef, useEffect } from 'react';
import { styled } from '@mui/material/styles';
import ErrorBoundary from './ErrorBoundary';
import PropTypes from 'prop-types';
import { 
  formatPrice, 
  formatNumber, 
  formatSentiment,
  formatNews,
  formatLargeNumber
} from '../utils/formatters';

// Helper functions
const formatMarketCap = (num) => {
  if (!num) return null;
  return formatNumber(num) + ' USD';
};

const formatPercent = (value) => {
  if (!value) return 'N/A';
  return `${(value * 100).toFixed(2)}%`;
};

const CommandContainer = styled('div')({
  display: 'flex',
  flexDirection: 'column',
  height: '200px', // Fixed height for command area
  backgroundColor: 'var(--terminal-black)'
});

const OutputContainer = styled('div')({
  flex: 1,
  overflowY: 'scroll',
  padding: '10px',
  '&::-webkit-scrollbar': {
    width: '8px'
  },
  '&::-webkit-scrollbar-track': {
    background: 'var(--terminal-black)'
  },
  '&::-webkit-scrollbar-thumb': {
    background: 'var(--terminal-green)',
    borderRadius: '4px'
  }
});

const CommandPrompt = styled('div')({
  display: 'flex',
  alignItems: 'center',
  padding: '5px 10px',
  borderTop: '1px solid var(--terminal-green)'
});

const CommandInput = styled('input')({
  flex: 1,
  backgroundColor: 'transparent',
  border: 'none',
  color: 'var(--terminal-green)',
  fontFamily: 'Courier New, monospace',
  fontSize: '14px',
  padding: '5px',
  '&:focus': {
    outline: 'none'
  }
});

const CommandControls = styled('div')({
  display: 'flex',
  gap: '10px',
  padding: '5px 10px',
  borderTop: '1px solid var(--terminal-green)',
  '& button': {
    backgroundColor: 'transparent',
    border: '1px solid var(--terminal-green)',
    color: 'var(--terminal-green)',
    padding: '2px 8px',
    cursor: 'pointer',
    fontSize: '12px',
    '&:hover': {
      backgroundColor: 'rgba(0, 255, 0, 0.1)'
    }
  }
});

const OutputLine = styled('div')({
  fontFamily: 'Courier New, monospace',
  color: 'var(--terminal-green)',
  marginBottom: '5px',
  whiteSpace: 'pre-wrap'
});

const TerminalCommand = ({ 
  onSymbolChange, 
  currentSymbol = '', 
  securityType = 'STOCK',
  data = {},
  isLoading = false,
  error = null,
  onError = () => {},
  setOutput = () => {}
}) => {
  const [command, setCommand] = useState('');
  const [outputHistory, setOutputHistory] = useState([]);
  const [commandHistory, setCommandHistory] = useState([]);
  const outputRef = useRef(null);

  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [outputHistory]);

  const addToHistory = (cmd, output) => {
    const timestamp = new Date().toLocaleTimeString();
    setOutputHistory(prev => [...prev, {
      timestamp,
      command: cmd,
      output,
      symbol: currentSymbol
    }]);
    setCommandHistory(prev => [...prev, cmd]);
  };

  const handleKeyPress = async (e) => {
    if (e.key === 'Enter' && command.trim()) {
      const input = command.trim();
      const output = await handleCommand(input);
      addToHistory(input, output);
      setCommand('');
    }
  };

  const clearHistory = () => {
    setOutputHistory([]);
  };

  const clearCommandHistory = () => {
    setCommandHistory([]);
  };

  const fetchData = async (endpoint, symbol, type) => {
    try {
      const url = `http://localhost:2008/api/${endpoint}/${encodeURIComponent(symbol)}?type=${encodeURIComponent(type)}`;
      console.log(`[Fetch] ${url}`);
      
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: response.statusText }));
        throw new Error(errorData.error || `Failed to fetch ${endpoint}`);
      }
      
      return response.json();
    } catch (error) {
      console.error(`[Error] ${endpoint}:`, error);
      throw error;
    }
  };

  const formatTechnical = (tech) => {
    if (!tech) return 'Technical data not available';
    
    const formatIndicator = (value, type = '') => {
      if (type === 'RSI') {
        const color = value > 70 ? 'red' : value < 30 ? 'green' : 'yellow';
        return `${value.toFixed(2)} [${color}]`;
      }
      return value.toFixed(2);
    };

    return `
RSI (14):    ${formatIndicator(tech.rsi, 'RSI')}
MACD:        ${formatIndicator(tech.macd.macd, 'TREND')}
SIGNAL:      ${formatIndicator(tech.macd.signal)}
BB UPPER:    ${formatIndicator(tech.bollinger.upper)}
BB LOWER:    ${formatIndicator(tech.bollinger.lower)}
SMA (20):    ${formatIndicator(tech.sma20, 'TREND')}
SMA (50):    ${formatIndicator(tech.sma50, 'TREND')}
VOLUME:      ${formatNumber(tech.volume)}`;
  };

  const formatPriceOutput = (quote) => {
    if (!quote || !quote.price) {
      return 'No price data available';
    }

    const price = quote.price;
    const trading = quote.trading || {};
    
    return `
PRICE DATA FOR ${quote.symbol}
-------------------------
Current:     ${price.current ? `$${price.current.toFixed(2)}` : 'N/A'}
Change:      ${price.change ? `$${price.change.toFixed(2)} (${price.changePercent?.toFixed(2)}%)` : 'N/A'}
Volume:      ${price.volume ? price.volume.toLocaleString() : 'N/A'}
Avg Volume:  ${price.avgVolume ? price.avgVolume.toLocaleString() : 'N/A'}
Vol/Avg:     ${price.volume && price.avgVolume ? `${((price.volume / price.avgVolume) * 100).toFixed(1)}%` : 'N/A'}

TRADING DATA
-----------
Day Range:   ${price.high && price.low ? `$${price.low.toFixed(2)} - $${price.high.toFixed(2)}` : 'N/A'}
Open:        ${price.open ? `$${price.open.toFixed(2)}` : 'N/A'}
Prev Close:  ${price.previousClose ? `$${price.previousClose.toFixed(2)}` : 'N/A'}
Bid/Ask:     ${trading.bid && trading.ask ? `$${trading.bid.toFixed(2)}/$${trading.ask.toFixed(2)}` : 'N/A'}
Market Cap:  ${quote.market?.cap ? `$${(quote.market.cap / 1e9).toFixed(2)}B` : 'N/A'}`;
  };

  const formatCommandOutput = (command, data) => {
    if (!data) return 'No data available';
    
    switch (command) {
      case 'PRICE':
        const quote = data.quote;
        if (!quote) return 'No price data available';
        
        return formatPriceOutput(quote);

      case 'TECH':
        const tech = data.technical;
        if (!tech) return 'No technical data available';
        
        return `
TECHNICAL ANALYSIS FOR ${data.quote?.symbol}
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

VOLUME
------
Current:     ${formatNumber(tech.volume)}
Average:     ${formatNumber(tech.avgVolume)}`;

      case 'NEWS':
        const news = data.news;
        if (!news?.length) return 'No news available';
        
        return news.map(item => `
[${new Date(item.publishedAt).toLocaleDateString()}] ${item.source.name}
${item.title}
${item.description ? item.description.slice(0, 150) + '...' : 'No description available'}
URL: ${item.url}
`).join('\n---\n');

      default:
        return 'Command output not formatted';
    }
  };

  const formatMarketData = (data) => {
    if (!data?.quote?.market) return 'No market data available';
    const mkt = data.quote.market;
    return `
MARKET DATA
-----------
Market Cap:      ${formatLargeNumber(mkt.cap)}
P/E Ratio:       ${mkt.pe?.toFixed(2) || 'N/A'}
Dividend Yield:  ${(mkt.dividendYield || 0).toFixed(2)}%
52w High:        ${formatPrice(mkt.fiftyTwoWeekHigh)}
52w Low:         ${formatPrice(mkt.fiftyTwoWeekLow)}`;
  };

  const formatFA = (data) => {
    if (!data?.quote?.fundamentals) return 'No fundamental data available';
    const fa = data.quote.fundamentals;
    return `
FUNDAMENTAL ANALYSIS
-------------------
Revenue:         ${formatLargeNumber(fa.revenue)}
Net Income:      ${formatLargeNumber(fa.netIncome)}
Operating Cash:  ${formatLargeNumber(fa.operatingCashFlow)}
Profit Margin:   ${(fa.profitMargin * 100).toFixed(2)}%
Debt/Equity:     ${fa.debtToEquity?.toFixed(2) || 'N/A'}`;
  };

  const COMMANDS = {
    'PRICE': {
      description: 'Show detailed price information',
      usage: 'PRICE',
      action: async () => {
        if (!currentSymbol) return 'No symbol selected';
        if (isLoading) return 'Loading...';
        if (error) return `Error: ${error}`;
        return formatCommandOutput('PRICE', data);
      }
    },
    'TECH': {
      description: 'Show technical analysis',
      usage: 'TECH',
      action: async () => {
        if (!currentSymbol) return 'No symbol selected';
        if (isLoading) return 'Loading...';
        if (error) return `Error: ${error}`;
        return formatCommandOutput('TECH', data);
      }
    },
    'NEWS': {
      description: 'Show recent news',
      usage: 'NEWS',
      action: async () => {
        if (!currentSymbol) return 'No symbol selected';
        if (isLoading) return 'Loading...';
        if (error) return `Error: ${error}`;
        return formatCommandOutput('NEWS', data);
      }
    },
    'HELP': {
      description: 'Show available commands',
      usage: 'HELP',
      action: (args, setOutput) => {
        const helpText = Object.entries(COMMANDS)
          .map(([cmd, info]) => `${cmd.padEnd(10)} - ${info.description}`)
          .join('\n');
        setOutput(helpText);
      }
    },
    'DES': {
      description: 'Display security description and basic info',
      usage: 'DES [symbol]',
      action: (args, setOutput, data) => {
        const basicInfo = data?.basicInfo || {};
        setOutput(`
DESCRIPTION: ${basicInfo.name}
EXCHANGE: ${basicInfo.exchange}
SECTOR: ${basicInfo.sector}
INDUSTRY: ${basicInfo.industry}
CURRENCY: ${basicInfo.currency}
TRADING HOURS: ${basicInfo.tradingHours}
        `);
      }
    },
    'FA': {
      description: 'Financial analysis and ratios',
      usage: 'FA [symbol]',
      action: async () => formatFA(data)
    },
    'BS': {
      description: 'Balance sheet summary',
      usage: 'BS [symbol]',
      action: (args, setOutput, data) => {
        const balance = data?.balanceSheet || {};
        setOutput(`
TOTAL ASSETS: $${(balance.totalAssets / 1e9).toFixed(2)}B
TOTAL LIABILITIES: $${(balance.totalLiabilities / 1e9).toFixed(2)}B
CASH: $${(balance.cashAndEquivalents / 1e9).toFixed(2)}B
DEBT: $${(balance.totalDebt / 1e9).toFixed(2)}B
CURRENT RATIO: ${balance.currentRatio}
QUICK RATIO: ${balance.quickRatio}
        `);
      }
    },
    'MKT': {
      description: 'Show market data',
      usage: 'MKT',
      action: async () => formatMarketData(data)
    },
    'COMPARE': {
      description: 'Compare multiple ETFs',
      usage: 'COMPARE [symbols]',
      action: (args, setOutput, data) => {
        if (!args[0]) {
          setOutput('Error: Please provide symbols to compare (e.g., COMPARE SPY QQQ VTI)');
          return;
        }
        
        const symbols = args;
        const comparison = {};
        
        for (const symbol of symbols) {
          if (!data[symbol]) {
            setOutput(`Error: No data available for ${symbol}`);
            return;
          }
          comparison[symbol] = data[symbol];
        }
        
        // Format comparison table
        const compareETFs = (etfs) => {
          const metrics = {
            'Expense Ratio': (etf) => formatPercent(etf.fa?.expenseRatio),
            'YTD Return': (etf) => formatPercent(etf.fa?.ytdReturn),
            '3Y Return': (etf) => formatPercent(etf.fa?.threeYearReturn),
            '5Y Return': (etf) => formatPercent(etf.fa?.fiveYearReturn),
            'Assets': (etf) => formatNumber(etf.fa?.totalAssets) + ' USD',
            'Dividend Yield': (etf) => formatPercent(etf.fa?.yield),
            'Beta': (etf) => etf.fa?.beta?.toFixed(2) || 'N/A'
          };

          // Header
          let output = '\nCOMPARISON\n----------\n';
          output += 'Metric'.padEnd(20);
          symbols.forEach(s => {
            output += s.padEnd(15);
          });
          output += '\n' + '-'.repeat(20 + symbols.length * 15) + '\n';

          // Metrics
          Object.entries(metrics).forEach(([name, fn]) => {
            output += name.padEnd(20);
            symbols.forEach(s => {
              output += fn(comparison[s]).padEnd(15);
            });
            output += '\n';
          });

          // Sector comparison
          output += '\nSECTOR WEIGHTS\n--------------\n';
          const sectors = new Set();
          symbols.forEach(s => {
            const sectorWeights = comparison[s].fa?.holdings?.sectorWeights || [];
            sectorWeights.forEach(w => {
              const [sector] = Object.entries(w).find(([,v]) => v > 0) || [];
              if (sector) sectors.add(sector);
            });
          });

          sectors.forEach(sector => {
            output += sector.replace('_', ' ').padEnd(20);
            symbols.forEach(s => {
              const weight = (comparison[s].fa?.holdings?.sectorWeights || [])
                .find(w => w[sector])?.[sector] || 0;
              output += formatPercent(weight).padEnd(15);
            });
            output += '\n';
          });

          return output;
        };

        setOutput(compareETFs(comparison));
      }
    },
    'WATCHLIST': {
      description: 'Manage watchlists',
      usage: 'WATCHLIST [ADD|REMOVE|LIST] [symbol]',
      action: async (args, setOutput) => {
        const [action, ...params] = args;
        
        switch (action?.toUpperCase()) {
          case 'ADD':
            if (!currentSymbol) return 'Error: No symbol selected';
            try {
              await fetch('/api/watchlist/default/symbol', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  symbol: currentSymbol,
                  type: securityType
                })
              });
              return `Added ${currentSymbol} to watchlist`;
            } catch (error) {
              return `Error: ${error.message}`;
            }
            
          case 'LIST':
            try {
              const response = await fetch('/api/watchlist/default/live');
              const data = await response.json();
              
              if (!data.symbols.length) {
                return 'Watchlist is empty';
              }
              
              return `
WATCHLIST
---------
${data.symbols.map(s => 
  `${s.symbol.padEnd(8)} ${s.data?.quote?.price?.toFixed(2) || 'N/A'} ${
    s.data?.quote?.changePercent ? 
    (s.data.quote.changePercent > 0 ? '↑' : '↓') + 
    Math.abs(s.data.quote.changePercent).toFixed(2) + '%' : 
    'N/A'
  }`
).join('\n')}`;
            } catch (error) {
              return `Error: ${error.message}`;
            }
            
          default:
            return `
WATCHLIST COMMANDS
-----------------
ADD   - Add current symbol to watchlist
REMOVE - Remove symbol from watchlist
LIST  - Show watchlist with live prices`;
        }
      }
    },
    'VOL': async () => {
      if (!data?.technical) return 'No volume data available';
      const vol = data.technical.volume;
      const avgVol = data.technical.avgVolume;
      const volChange = data.technical.volumeChange;
      const volumes = data.technical.volumes.filter(v => v !== null && !isNaN(v));
      const volProfile = data.technical.volumeProfile;
      
      const formatVol = (v) => v === null || isNaN(v) ? 'N/A' : formatNumber(v);
      const formatRatio = (current, avg) => {
        if (!current || !avg) return 'N/A';
        return `${((current/avg)*100).toFixed(1)}%`;
      };
      
      return `
VOLUME ANALYSIS
--------------
Current:     ${formatVol(vol)}
Average:     ${formatVol(avgVol)}
Ratio:       ${formatRatio(vol, avgVol)} of avg
Daily Range: ${formatVol(volProfile.min)} - ${formatVol(volProfile.max)}
Change:      ${!volChange ? 'N/A' : `${volChange > 0 ? '↑' : '↓'}${Math.abs(volChange).toFixed(1)}%`}

RELATIVE VOLUME
--------------
vs 5-day:    ${volProfile.relativeVolume?.['5d']?.toFixed(1)}%
vs 20-day:   ${volProfile.relativeVolume?.['20d']?.toFixed(1)}%

VOLUME TREND
-----------
${volumes.map((v, i) => {
  const label = v === volProfile.max ? ' (MAX)' : v === volProfile.min ? ' (MIN)' : '';
  return `D-${volumes.length-i-1}: ${formatVol(v)}${label}`;
}).join('\n')}

MOMENTUM
--------
Trend:       ${volProfile.trend || 'N/A'}
Pattern:     ${volProfile.consistency || 'N/A'}
Strength:    ${volProfile.trendStrength || 'N/A'}
Volatility:  ${volProfile.volatility ? volProfile.volatility.toFixed(1) + '%' : 'N/A'}`;
    }
  };

  const handleCommand = async (input) => {
    try {
      const [cmd, ...args] = input.toUpperCase().split(' ');
      
      switch (cmd) {
        case 'SYMBOL':
          if (!args[0]) {
            return 'Error: Please provide a symbol (e.g., SYMBOL AAPL)';
          }
          const symbol = args[0];
          let type = 'STOCK';
          
          // Detect security type from symbol format
          if (['SPY', 'QQQ', 'IWM', 'DIA', 'VTI', 'VOO'].includes(symbol)) {
            type = 'ETF';
          } else if (symbol.includes('/') || /^[A-Z]{6}$/.test(symbol)) {
            type = 'FOREX';
          } else if (symbol.startsWith('$') || /^(BTC|ETH|SOL)/.test(symbol)) {
            type = 'CRYPTO';
          } else if (symbol.includes('=F')) {
            type = 'FUTURES';
          } else if (/\d{6}[CP]\d+/.test(symbol)) {
            type = 'OPTION';
          }
          
          onSymbolChange(symbol, type);
          return `Changed symbol to ${symbol} (${type})`;

        case 'PRICE':
        case 'FA':
        case 'MKT':
        case 'TECH':
          if (!currentSymbol) return 'Error: No symbol selected';
          if (isLoading) return 'Loading...';
          if (error) return `Error: ${error}`;
          return formatCommandOutput(cmd, data);

        case 'NEWS':
          if (!currentSymbol) return 'Error: No symbol selected';
          if (isLoading) return 'Loading...';
          if (error) return `Error: ${error}`;
          return formatCommandOutput('NEWS', data);

        case 'HELP':
          return `
Available Commands:
------------------
SYMBOL <ticker>  Set active symbol (e.g., SYMBOL AAPL)
PRICE           Show current price and trading data
FA              Financial analysis
MKT             Market data
TECH            Technical analysis
DES             Security description
NEWS            Show recent news
HELP            Show this help message

Security Types:
--------------
Stocks:  AAPL, MSFT, GOOGL
ETFs:    SPY, QQQ, VTI
Forex:   EURUSD, GBPUSD, USDJPY
Crypto:  BTC, ETH, SOL
Options: AAPL230915C170
Futures: ES=F, NQ=F, CL=F
`;

        case 'CLEAR':
        case 'CLS':
          setOutputHistory([]);
          return '';

        case 'COMPARE':
          if (!args[0]) {
            return 'Error: Please provide symbols to compare (e.g., COMPARE SPY QQQ VTI)';
          }
          
          const symbols = args;
          const comparison = {};
          
          for (const symbol of symbols) {
            if (!data[symbol]) {
              return `Error: No data available for ${symbol}`;
            }
            comparison[symbol] = data[symbol];
          }
          
          // Format comparison table
          const compareETFs = (etfs) => {
            const metrics = {
              'Expense Ratio': (etf) => formatPercent(etf.fa?.expenseRatio),
              'YTD Return': (etf) => formatPercent(etf.fa?.ytdReturn),
              '3Y Return': (etf) => formatPercent(etf.fa?.threeYearReturn),
              '5Y Return': (etf) => formatPercent(etf.fa?.fiveYearReturn),
              'Assets': (etf) => formatNumber(etf.fa?.totalAssets) + ' USD',
              'Dividend Yield': (etf) => formatPercent(etf.fa?.yield),
              'Beta': (etf) => etf.fa?.beta?.toFixed(2) || 'N/A'
            };

            // Header
            let output = '\nCOMPARISON\n----------\n';
            output += 'Metric'.padEnd(20);
            symbols.forEach(s => {
              output += s.padEnd(15);
            });
            output += '\n' + '-'.repeat(20 + symbols.length * 15) + '\n';

            // Metrics
            Object.entries(metrics).forEach(([name, fn]) => {
              output += name.padEnd(20);
              symbols.forEach(s => {
                output += fn(comparison[s]).padEnd(15);
              });
              output += '\n';
            });

            // Sector comparison
            output += '\nSECTOR WEIGHTS\n--------------\n';
            const sectors = new Set();
            symbols.forEach(s => {
              const sectorWeights = comparison[s].fa?.holdings?.sectorWeights || [];
              sectorWeights.forEach(w => {
                const [sector] = Object.entries(w).find(([,v]) => v > 0) || [];
                if (sector) sectors.add(sector);
              });
            });

            sectors.forEach(sector => {
              output += sector.replace('_', ' ').padEnd(20);
              symbols.forEach(s => {
                const weight = (comparison[s].fa?.holdings?.sectorWeights || [])
                  .find(w => w[sector])?.[sector] || 0;
                output += formatPercent(weight).padEnd(15);
              });
              output += '\n';
            });

            return output;
          };

          return compareETFs(comparison);

        case 'WATCHLIST':
          return await COMMANDS['WATCHLIST'].action(args, setOutput);

        case 'VOL':
          return COMMANDS['VOL']();

        default:
          return `Unknown command: ${cmd}\nType HELP for available commands`;
      }
    } catch (err) {
      console.error('Command error:', err);
      onError?.(err);
      return `Error executing command: ${err.message}`;
    }
  };

  return (
    <ErrorBoundary>
      <CommandContainer>
        <OutputContainer ref={outputRef}>
          {outputHistory.map((entry, index) => (
            <div key={index}>
              <OutputLine style={{ color: '#666' }}>
                [{entry.timestamp}] {entry.symbol}> {entry.command}
              </OutputLine>
              <OutputLine>{entry.output}</OutputLine>
            </div>
          ))}
        </OutputContainer>
        
        <CommandControls>
          <button onClick={clearHistory}>Clear Output</button>
          <button onClick={clearCommandHistory}>Clear History</button>
          <span style={{ marginLeft: 'auto', color: '#666' }}>
            {commandHistory.length} commands in history
          </span>
        </CommandControls>

        <CommandPrompt>
          <span style={{ color: 'var(--terminal-green)', marginRight: '10px' }}>
            {currentSymbol || 'NO SYMBOL'}>{' '}
          </span>
          <CommandInput
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder={`Enter command (type 'HELP' for list of commands) - Current: ${currentSymbol || 'NONE'}`}
          />
        </CommandPrompt>
      </CommandContainer>
    </ErrorBoundary>
  );
};

TerminalCommand.propTypes = {
  onSymbolChange: PropTypes.func.isRequired,
  currentSymbol: PropTypes.string,
  securityType: PropTypes.string,
  data: PropTypes.object,
  isLoading: PropTypes.bool,
  error: PropTypes.string,
  onError: PropTypes.func,
  setOutput: PropTypes.func
};

export default TerminalCommand; 