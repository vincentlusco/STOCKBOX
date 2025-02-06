export class EnhancedRateLimiter {
  constructor() {
    this.limits = {
      ALPHA_VANTAGE: { max: 5, window: 60000 }, // 5 per minute
      POLYGON: { max: 5, window: 60000 },
      FINNHUB: { max: 30, window: 60000 },
      FMP: { max: 10, window: 60000 },
      NEWS_API: { max: 100, window: 3600000 } // 100 per hour
    };
    this.requests = {};
  }

  async throttle(api) {
    if (!this.requests[api]) {
      this.requests[api] = [];
    }

    const now = Date.now();
    const limit = this.limits[api];
    
    // Clean old requests
    this.requests[api] = this.requests[api].filter(
      time => now - time < limit.window
    );

    if (this.requests[api].length >= limit.max) {
      const oldestRequest = this.requests[api][0];
      const waitTime = limit.window - (now - oldestRequest);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }

    this.requests[api].push(now);
  }
} 