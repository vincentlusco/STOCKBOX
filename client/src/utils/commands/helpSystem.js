import { AVAILABLE_COMMANDS } from '../constants';

const commandDescriptions = {
  // Base Commands
  PRICE: 'Display current price and trading data',
  VOL: 'Show volume analysis and trends',
  TECH: 'Show technical analysis indicators',
  DES: 'Display security description and info',
  NEWS: 'Display recent news articles',

  // Stock Commands
  FA: 'Show fundamental analysis data (P/E, ROE, margins, etc)',
  DIV: 'Display dividend information',

  // ETF Commands
  HOLD: 'Show ETF holdings and allocations',
  FLOW: 'Display fund flow information',

  // Crypto Commands
  MARKET: 'Show cryptocurrency market data',
  CHAIN: 'Display blockchain statistics',

  // Futures Commands
  CONTRACT: 'Show futures contract specifications',
  TERM: 'Display term structure and spreads',

  // Options Commands
  CHAIN: 'Display option chain data',
  GREEK: 'Show options Greeks analysis',
  IV: 'Display implied volatility data',

  // Forex Commands
  RATE: 'Show interest rates and differentials',

  // Bond Commands
  YIELD: 'Display yield curve and analysis',
  RISK: 'Show risk metrics and ratings'
};

export const getCommandHelp = (type) => {
  if (!type) {
    return `
Available Security Types:
- STOCK:   Stock trading
- ETF:     Exchange Traded Funds
- CRYPTO:  Cryptocurrencies
- FUTURES: Futures contracts
- OPTIONS: Options contracts
- FOREX:   Foreign Exchange
- BONDS:   Fixed Income

Type 'HELP <type>' for specific commands.`;
  }

  const typeCommands = AVAILABLE_COMMANDS[type];
  if (!typeCommands) {
    throw new Error(`Unknown security type: ${type}`);
  }

  return `
Commands for ${type}:
${typeCommands.map(cmd => 
  `${cmd.padEnd(10)} - ${commandDescriptions[cmd]}`
).join('\n')}

Global Commands:
SYMBOL <ticker> - Change current symbol
CLEAR          - Clear terminal output
HELP           - Show this help message`;
};

export const formatHelpOutput = (type) => {
  if (!type) {
    return `
Available Security Types:
- STOCK:   Stock trading
- ETF:     Exchange Traded Funds
- CRYPTO:  Cryptocurrencies
- FUTURES: Futures contracts
- OPTIONS: Options contracts
- FOREX:   Foreign Exchange
- BONDS:   Fixed Income

Type 'HELP <type>' for specific commands.`;
  }

  const commands = AVAILABLE_COMMANDS[type];
  if (!commands) {
    throw new Error(`Unknown security type: ${type}`);
  }

  return `
Commands for ${type}:
${commands.map(cmd => `${cmd.padEnd(10)} - ${commandDescriptions[cmd]}`).join('\n')}

Global Commands:
SYMBOL <ticker> - Change current symbol
CLEAR          - Clear terminal output
HELP           - Show this help message`;
};

export const helpSystem = {
  getCommandHelp: (type) => {
    if (!type) {
      return `
Available Security Types:
- STOCK:   Stock trading
- ETF:     Exchange Traded Funds
- CRYPTO:  Cryptocurrencies
- FUTURES: Futures contracts
- OPTIONS: Options contracts
- FOREX:   Foreign Exchange
- BONDS:   Fixed Income

Type 'HELP <type>' for specific commands.`;
    }

    const commands = AVAILABLE_COMMANDS[type];
    if (!commands) {
      return `Unknown security type: ${type}`;
    }

    return `Available commands for ${type}:\n${commands.join('\n')}`;
  }
}; 