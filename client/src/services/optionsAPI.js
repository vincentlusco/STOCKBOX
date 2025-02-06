import { API_KEYS } from '../config/apiKeys';

class OptionsAPI {
  constructor() {
    this.baseURL = 'http://localhost:2008/api/options';
  }

  // Get available options for a stock
  async getOptionChain(underlying) {
    try {
      const response = await fetch(`${this.baseURL}/chain/${underlying}`);
      if (!response.ok) throw new Error('Failed to fetch option chain');
      return await response.json();
    } catch (error) {
      console.error('Error fetching option chain:', error);
      throw error;
    }
  }

  // Get specific option data
  async getOptionQuote(optionSymbol) {
    try {
      const response = await fetch(`${this.baseURL}/quote/${optionSymbol}`);
      if (!response.ok) throw new Error('Failed to fetch option quote');
      return await response.json();
    } catch (error) {
      console.error('Error fetching option quote:', error);
      throw error;
    }
  }

  // Get available expiration dates
  async getExpirationDates(underlying) {
    try {
      const response = await fetch(`${this.baseURL}/expirations/${underlying}`);
      if (!response.ok) throw new Error('Failed to fetch expiration dates');
      return await response.json();
    } catch (error) {
      console.error('Error fetching expiration dates:', error);
      throw error;
    }
  }

  // Get strikes for specific expiration
  async getStrikes(underlying, expiration) {
    try {
      const response = await fetch(`${this.baseURL}/strikes/${underlying}/${expiration}`);
      if (!response.ok) throw new Error('Failed to fetch strikes');
      return await response.json();
    } catch (error) {
      console.error('Error fetching strikes:', error);
      throw error;
    }
  }
}

export const optionsAPI = new OptionsAPI(); 