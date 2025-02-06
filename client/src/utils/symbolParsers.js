export const parseOptionsSymbol = (symbol) => {
  // Handle both formats: AAPL230915C150 and AAPL_230915_C_150
  const regex = /^(\w+)(?:_)?(\d{2})(\d{2})(\d{2})(?:_)?([CP])(?:_)?(\d+(?:\.\d+)?)$/;
  const match = symbol.match(regex);
  
  if (!match) {
    throw new Error('Invalid options symbol format');
  }
  
  const [_, underlying, year, month, day, type, strike] = match;
  
  return {
    underlying,
    expiration: new Date(`20${year}-${month}-${day}`),
    type: type === 'C' ? 'CALL' : 'PUT',
    strike: parseFloat(strike),
    isWeekly: false,
    daysToExpiry: Math.ceil((new Date(`20${year}-${month}-${day}`) - new Date()) / (1000 * 60 * 60 * 24))
  };
}; 