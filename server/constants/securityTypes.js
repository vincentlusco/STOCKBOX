const SECURITY_TYPES = {
  STOCK: {
    name: 'Stock',
    yahooSuffix: '',
    validSymbolRegex: /^[A-Z]{1,5}$/,
    commands: ['PRICE', 'FA', 'MKT', 'TECH', 'NEWS', 'DES', 'BS', 'COMPARE']
  },
  ETF: {
    name: 'ETF',
    yahooSuffix: '',
    validSymbolRegex: /^[A-Z]{1,5}$/,
    commands: ['PRICE', 'FA', 'MKT', 'TECH', 'NEWS', 'DES', 'COMPARE', 'HOLDINGS']
  },
  FOREX: {
    name: 'Forex',
    yahooSuffix: '=X',
    validSymbolRegex: /^[A-Z]{6}$/,
    commands: ['PRICE', 'FA', 'MKT', 'TECH']
  },
  CRYPTO: {
    name: 'Crypto',
    yahooSuffix: '-USD',
    validSymbolRegex: /^[A-Z]{3,5}$/,
    commands: ['PRICE', 'FA', 'MKT', 'TECH', 'NEWS']
  },
  INDEX: {
    name: 'Index',
    yahooSuffix: '^',
    validSymbolRegex: /^[A-Z.]{1,10}$/,
    commands: ['PRICE', 'MKT', 'TECH', 'NEWS']
  },
  FUTURES: {
    name: 'Futures',
    yahooSuffix: '=F',
    validSymbolRegex: /^[A-Z]{2}$/,
    commands: ['PRICE', 'MKT', 'TECH']
  },
  OPTION: {
    name: 'Option',
    yahooSuffix: '',
    validSymbolRegex: /^\w+\d{6}[CP]\d+$/,
    commands: ['PRICE', 'GREEKS', 'CHAIN']
  }
};

module.exports = SECURITY_TYPES; 