class DataAggregator {
  // ... existing code ...

  async validateSymbol(symbol, type) {
    try {
      switch (type.toUpperCase()) {
        case 'STOCK':
          const stockData = await yahooFinance.quote(symbol);
          return !!stockData;
          
        case 'ETF':
          const etfData = await yahooFinance.quote(symbol);
          return !!etfData && etfData.quoteType === 'ETF';
          
        case 'CRYPTO':
          const cryptoSymbol = symbol.endsWith('-USD') ? symbol : `${symbol}-USD`;
          const cryptoData = await yahooFinance.quote(cryptoSymbol);
          return !!cryptoData;
          
        case 'FUTURES':
          const futuresSymbol = symbol.endsWith('=F') ? symbol : `${symbol}=F`;
          const futuresData = await yahooFinance.quote(futuresSymbol);
          return !!futuresData;
          
        case 'FOREX':
          const forexSymbol = symbol.endsWith('=X') ? symbol : `${symbol}=X`;
          const forexData = await yahooFinance.quote(forexSymbol);
          return !!forexData;
          
        default:
          return false;
      }
    } catch (error) {
      console.error(`[Validation] Error validating ${symbol}:`, error);
      // Return true for development to allow testing
      return process.env.NODE_ENV === 'development';
    }
  }
} 