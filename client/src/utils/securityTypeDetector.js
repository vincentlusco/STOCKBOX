export const detectSecurityType = (symbol) => {
  // ETF detection patterns
  const etfPatterns = {
    // Common ETF suffixes
    suffixes: ['ETF', 'FUND', 'TRUST'],
    // Popular ETF tickers
    tickers: [
      'SPY', 'QQQ', 'IWM', 'VTI', 'VOO', 'VEA', 'VWO', 'BND', 'VNQ', 'GLD',
      'IAU', 'SLV', 'USO', 'UNG', 'DIA', 'XLF', 'XLE', 'XLK', 'XLV', 'XLI',
      'XLP', 'XLY', 'XLB', 'XLU', 'XLRE', 'EEM', 'IVV', 'AGG', 'LQD', 'TLT'
    ],
    // ETF providers
    providers: ['SPDR', 'ISHARES', 'VANGUARD', 'INVESCO', 'SCHWAB', 'DIREXION']
  };

  // Check if symbol matches ETF patterns
  if (
    etfPatterns.tickers.includes(symbol) ||
    etfPatterns.suffixes.some(suffix => symbol.endsWith(suffix)) ||
    etfPatterns.providers.some(provider => symbol.startsWith(provider))
  ) {
    return 'ETF';
  }

  if (symbol.includes('=F')) return 'FUTURES';
  if (symbol.includes('-USD')) return 'CRYPTO';
  if (symbol.includes('=X')) return 'FOREX';
  if (symbol.includes('^')) return 'INDEX';
  if (symbol.endsWith('=B')) return 'BONDS';
  if (symbol.includes('-') || symbol.includes('/')) return 'OPTIONS';
  return 'STOCK';
}; 