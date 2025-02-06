import { formatPrice, formatNumber } from './formatters';
import { 
  stockCommands
} from './commands/stockCommands';
import { 
  optionsCommands
} from './commands/optionsCommands';
import { 
  forexCommands
} from './commands/forexCommands';
import { 
  cryptoCommands
} from './commands/cryptoCommands';
import { 
  bondCommands
} from './commands/bondCommands';
import { 
  etfCommands
} from './commands/etfCommands';
import { 
  helpCommands
} from './commands/helpCommands';

// Security types enum
export const SECURITY_TYPES = {
  STOCK: 'STOCK',
  ETF: 'ETF',
  CRYPTO: 'CRYPTO',
  FOREX: 'FOREX',
  FUTURES: 'FUTURES',
  BONDS: 'BONDS',
  OPTIONS: 'OPTIONS'
};

// Available commands by security type
export const AVAILABLE_COMMANDS = {
  STOCK: Object.keys(stockCommands),
  OPTIONS: Object.keys(optionsCommands),
  FOREX: Object.keys(forexCommands),
  CRYPTO: Object.keys(cryptoCommands),
  BONDS: Object.keys(bondCommands),
  ETF: Object.keys(etfCommands)
};

// Command router
export const routeCommand = async (command, symbol, type) => {
  const commandMap = {
    STOCK: stockCommands,
    OPTIONS: optionsCommands,
    FOREX: forexCommands,
    CRYPTO: cryptoCommands,
    BONDS: bondCommands,
    ETF: etfCommands
  };

  const handler = commandMap[type]?.[command];
  if (!handler) {
    throw new Error(`Invalid command ${command} for ${type}`);
  }

  return handler(symbol);
};

// Help text generator
export const getHelpText = (type) => {
  if (!type) {
    return `
STOCKBOX TERMINAL HELP
=====================

Global Commands:
---------------
SYMBOL <ticker>  Set active symbol (e.g., SYMBOL AAPL)
HELP [type]      Show commands (e.g., HELP STOCK)
CLEAR/CLS        Clear terminal output

Security Types:
-------------
${Object.keys(AVAILABLE_COMMANDS).join(', ')}

Type HELP <security type> for specific commands`;
  }

  const commands = AVAILABLE_COMMANDS[type];
  if (!commands) {
    return `Unknown security type: ${type}`;
  }

  return `
Available commands for ${type}:
${commands.join('\n')}`;
};

/**
 * Handles global commands available across all security types
 */
const handleGlobalCommand = (cmd, symbol, type) => {
  switch (cmd) {
    case 'HELP':
      return getHelpText(type);
    case 'CLEAR':
    case 'CLS':
      return '';
    case 'SYMBOL':
      return `Current symbol: ${symbol} (${type})`;
    default:
      throw new Error(`Unknown global command: ${cmd}`);
  }
};

/**
 * Gets detailed help text for available commands
 */
export const getCommandHelp = (type) => {
  if (!type) {
    return `
STOCKBOX TERMINAL HELP
=====================

TERMINAL BASICS
-------------
The StockBox Terminal is a command-line interface for financial market data.
Commands are entered in the format: COMMAND [SYMBOL]

Example: PRICE AAPL - Shows price data for Apple Inc.
         VOL BTC-USD - Shows volume data for Bitcoin

NAVIGATION
---------
- Use UP/DOWN arrows to cycle through command history
- Use TAB for command auto-completion
- Type 'CLEAR' or 'CLS' to clear the terminal
- Type 'HELP <type>' for security-specific commands
- Type 'HELP <command>' for detailed command info

AVAILABLE SECURITY TYPES
---------------------
STOCK   - Equity securities (e.g., AAPL, MSFT)
ETF     - Exchange Traded Funds (e.g., SPY, QQQ)
CRYPTO  - Cryptocurrencies (e.g., BTC-USD, ETH-USD)
FUTURES - Futures contracts (e.g., ES=F, CL=F)
FOREX   - Foreign Exchange (e.g., EUR=X, JPY=X)
BONDS   - Fixed Income (e.g., ^TNX, ^TYX)
OPTIONS - Options contracts (e.g., AAPL230915C00150000)

GLOBAL COMMANDS
-------------
SYMBOL <ticker> - Change current symbol
HELP           - Show this help text
HELP <type>    - Show commands for security type
HELP <command> - Show detailed command info
CLEAR/CLS      - Clear terminal output

Type 'HELP <type>' for security-specific commands.`;
  }

  // If a specific security type is requested
  if (AVAILABLE_COMMANDS[type]) {
    return getSecurityTypeHelp(type);
  }

  // If a specific command is requested
  const commandHelp = getCommandSpecificHelp(type);
  if (commandHelp) return commandHelp;

  throw new Error(`Invalid help topic: ${type}`);
};

/**
 * Gets help text for specific security type
 */
const getSecurityTypeHelp = (type) => {
  const commands = AVAILABLE_COMMANDS[type];
  const descriptions = COMMAND_DESCRIPTIONS[type];

  return `
${type} COMMANDS
${'-'.repeat(type.length + 9)}
Available commands for ${type} securities:

${commands.map(cmd => 
  `${cmd.padEnd(8)} - ${descriptions[cmd] || 'No description available'}`
).join('\n')}

USAGE EXAMPLES
------------
${getExamplesByType(type)}

Type 'HELP <command>' for detailed command info.
Type 'HELP' for general terminal help.`;
};

/**
 * Command descriptions by security type
 */
const COMMAND_DESCRIPTIONS = {
  STOCK: {
    PRICE: 'Current price, change, volume and trading data (Yahoo)',
    VOL: 'Volume analysis and trends (Yahoo)',
    TECH: 'Technical indicators - RSI, MACD, BB (Calculated)',
    NEWS: 'Latest news and headlines (Yahoo)',
    DIV: 'Dividend information (Yahoo)',
    DES: 'Company description and sector info (Yahoo)',
    EARN: 'Earnings dates and history (Yahoo)'
  },
  
  CRYPTO: {
    PRICE: 'Current price and trading data (Binance)',
    VOL: 'Volume analysis and trends (Binance)',
    TECH: 'Technical indicators (Calculated)',
    DEPTH: 'Order book depth and liquidity (Binance)',
    TRADES: 'Recent trades and market activity (Binance)'
  },
  
  FOREX: {
    PRICE: 'Current exchange rates (Exchange Rates API)',
    TECH: 'Technical analysis (Calculated)',
    RATE: 'Interest rates from central banks'
  },
  
  FUTURES: {
    PRICE: 'Current futures prices (Yahoo)',
    TECH: 'Technical analysis (Calculated)',
    SPEC: 'Contract specifications (CME)',
    COT: 'Commitment of Traders report (CFTC)'
  },
  
  BONDS: {
    PRICE: 'Current bond prices (FRED)',
    YIELD: 'Yield analysis (FRED)',
    CURVE: 'Yield curve data (FRED)'
  },
  
  OPTIONS: {
    PRICE: 'Options prices and greeks (Yahoo)',
    CHAIN: 'Full options chain (Yahoo)',
    GREEK: 'Greeks calculations (Calculated)'
  }
};

/**
 * Gets example commands by security type
 */
const getExamplesByType = (type) => {
  const examples = {
    STOCK: `
PRICE AAPL     - Get Apple's current price data
TECH MSFT      - View Microsoft's technical indicators
VOL TSLA       - Tesla's volume analysis
NEWS GOOGL     - Latest Google news`,
    
    CRYPTO: `
PRICE BTC-USD  - Bitcoin price data
DEPTH ETH-USD  - Ethereum order book
VOL BNB-USD    - Binance Coin volume
TRADES BTC-USD - Recent Bitcoin trades`,
    
    FOREX: `
PRICE EUR=X    - EUR/USD exchange rate
TECH GBP=X     - GBP/USD technical analysis
RATE JPY=X     - Japanese Yen interest rates`,
    
    FUTURES: `
PRICE ES=F     - S&P 500 futures price
TECH CL=F      - Crude Oil technical analysis
COT GC=F       - Gold futures COT report`,
    
    BONDS: `
PRICE ^TNX     - 10-Year Treasury price
YIELD ^TYX     - 30-Year Treasury yield
CURVE ^FVX     - Treasury yield curve`,
    
    OPTIONS: `
PRICE AAPL240119C00150000  - Apple call option price
CHAIN TSLA                 - Tesla options chain
GREEK SPY240621P00400000   - SPY put greeks`
  };

  return examples[type] || 'No examples available.';
};

/**
 * Gets detailed help for specific commands
 */
const getCommandSpecificHelp = (command) => {
  const commandHelp = {
    PRICE: `
PRICE COMMAND
------------
Shows current price and trading data for any security.

USAGE
-----
PRICE <symbol>

EXAMPLES
--------
PRICE AAPL     - Stock price for Apple
PRICE BTC-USD  - Bitcoin price
PRICE EUR=X    - EUR/USD exchange rate

DATA DISPLAYED
------------
- Current price and change
- Trading volume
- Day range
- Market-specific metrics
  * Stocks: Market cap, P/E
  * Crypto: Market cap, dominance
  * Forex: Bid/ask spread
  * etc.

Updates every 5 seconds for real-time data.`,
    // ... add detailed help for other commands
  };

  return commandHelp[command.toUpperCase()] || null;
};

export const handleCommand = async (input) => {
  const { command, symbol, type } = parseCommand(input);
  
  // Initial data fetch
  const data = await fetchCommandData(command, symbol, type);
  
  // Format and return initial response
  const response = formatCommandResponse(command, data);
  
  // Return both the response and metadata for live updates
  return {
    response,
    metadata: {
      command,
      symbol,
      type,
      supportsLive: command === 'PRICE' // Only PRICE commands get live updates
    }
  };
};

// Add missing functions
const parseCommand = (input) => {
  const [cmd, ...args] = input.trim().toUpperCase().split(' ');
  return { cmd, args };
};

const fetchCommandData = async (symbol, type) => {
  // Implement data fetching logic
  return {};
};

const formatCommandResponse = (data) => {
  // Implement formatting logic
  return data;
};

export { parseCommand, fetchCommandData, formatCommandResponse };