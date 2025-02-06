import { APIs } from './securityAPIs';

class MarketDataService {
  constructor() {
    this.apis = APIs;
    this.baseURL = '/api';
  }

  async searchSecurity(query) {
    // Search across all security types
    const results = await Promise.all([
      this.apis.stock.search(query),
      this.apis.options.search(query),
      this.apis.futures.search(query),
      this.apis.forex.search(query),
      this.apis.crypto.search(query)
    ]);

    return results.flat().filter(Boolean);
  }

  async getQuote(symbol, type) {
    try {
      const response = await fetch(`${this.baseURL}/quote/${symbol}?type=${type}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch quote');
      }
      return await response.json();
    } catch (error) {
      console.error('Quote Error:', error);
      throw error;
    }
  }

  async getSecurityData(symbol, type, command) {
    try {
      const response = await fetch(`${this.baseURL}/quote/${symbol}?type=${type}&command=${command}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch security data');
      }
      return await response.json();
    } catch (error) {
      console.error('MarketData Error:', error);
      throw error;
    }
  }
}

export const marketData = new MarketDataService(); 