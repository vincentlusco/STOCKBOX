class BaseAPI {
  constructor(baseURL) {
    this.baseURL = baseURL || 'http://localhost:2008/api';
  }

  async fetchWithErrorHandling(endpoint, options = {}) {
    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        }
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API Error (${endpoint}):`, error);
      throw error;
    }
  }

  // Common methods for all security types
  async search(query) {
    return this.fetchWithErrorHandling(`/search?q=${encodeURIComponent(query)}`);
  }

  async quote(symbol, type) {
    return this.fetchWithErrorHandling(`/quote/${symbol}?type=${type}`);
  }

  async technicals(symbol, type) {
    return this.fetchWithErrorHandling(`/technicals/${symbol}?type=${type}`);
  }
}

export default BaseAPI; 