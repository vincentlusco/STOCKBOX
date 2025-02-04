const symbolCache = new Map();
const CACHE_DURATION = 30000; // 30 seconds

export const cacheSymbolData = (symbol, data) => {
  symbolCache.set(symbol, {
    data,
    timestamp: Date.now()
  });
};

export const getCachedSymbolData = (symbol) => {
  const cached = symbolCache.get(symbol);
  if (!cached) return null;
  
  if (Date.now() - cached.timestamp > CACHE_DURATION) {
    symbolCache.delete(symbol);
    return null;
  }
  
  return cached.data;
}; 