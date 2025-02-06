import BaseAPI from './baseAPI';

class StockAPI extends BaseAPI {
  async getFundamentals(symbol) {
    return this.fetchWithErrorHandling(`/stock/fundamentals/${symbol}`);
  }

  async getDividends(symbol) {
    return this.fetchWithErrorHandling(`/stock/dividends/${symbol}`);
  }

  async getEarnings(symbol) {
    return this.fetchWithErrorHandling(`/stock/earnings/${symbol}`);
  }
}

class OptionsAPI extends BaseAPI {
  async getChain(symbol) {
    return this.fetchWithErrorHandling(`/options/chain/${symbol}`);
  }

  async getExpirations(symbol) {
    return this.fetchWithErrorHandling(`/options/expirations/${symbol}`);
  }

  async getStrikes(symbol, expiration) {
    return this.fetchWithErrorHandling(`/options/strikes/${symbol}/${expiration}`);
  }
}

class FuturesAPI extends BaseAPI {
  async getContract(symbol) {
    return this.fetchWithErrorHandling(`/futures/contract/${symbol}`);
  }

  async getTerm(symbol) {
    return this.fetchWithErrorHandling(`/futures/term/${symbol}`);
  }

  async getCOT(symbol) {
    return this.fetchWithErrorHandling(`/futures/cot/${symbol}`);
  }
}

class ForexAPI extends BaseAPI {
  async getRates(symbol) {
    return this.fetchWithErrorHandling(`/forex/rates/${symbol}`);
  }

  async getForward(symbol) {
    return this.fetchWithErrorHandling(`/forex/forward/${symbol}`);
  }
}

class CryptoAPI extends BaseAPI {
  async getMarketData(symbol) {
    return this.fetchWithErrorHandling(`/crypto/market/${symbol}`);
  }

  async getBlockchain(symbol) {
    return this.fetchWithErrorHandling(`/crypto/blockchain/${symbol}`);
  }
}

export const APIs = {
  stock: new StockAPI(),
  options: new OptionsAPI(),
  futures: new FuturesAPI(),
  forex: new ForexAPI(),
  crypto: new CryptoAPI()
}; 