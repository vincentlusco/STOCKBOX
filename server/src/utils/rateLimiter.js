// Enhanced rate limiter with multiple tiers
export class EnhancedRateLimiter {
  constructor() {
    this.limits = {
      ALPHA_VANTAGE: {
        perMinute: 5,
        perDay: 500,
        requests: [],
        dailyRequests: []
      },
      POLYGON: {
        perMinute: 5,
        requests: []
      },
      FINNHUB: {
        perMinute: 60,
        requests: []
      },
      FMP: {
        perDay: 250,
        dailyRequests: []
      },
      NEWS_API: {
        perDay: 100,
        dailyRequests: []
      },
      COINGECKO: {
        perMinute: 50,
        requests: []
      }
    };
  }

  async throttle(api) {
    const limit = this.limits[api];
    const now = Date.now();

    // Clean up old requests
    if (limit.requests) {
      limit.requests = limit.requests.filter(time => now - time < 60000);
    }
    if (limit.dailyRequests) {
      limit.dailyRequests = limit.dailyRequests.filter(time => now - time < 86400000);
    }

    // Check minute-based limits
    if (limit.perMinute && limit.requests.length >= limit.perMinute) {
      const oldestRequest = limit.requests[0];
      const waitTime = 60000 - (now - oldestRequest);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }

    // Check daily limits
    if (limit.perDay && limit.dailyRequests.length >= limit.perDay) {
      const oldestDaily = limit.dailyRequests[0];
      const waitTime = 86400000 - (now - oldestDaily);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }

    // Record the request
    if (limit.requests) limit.requests.push(now);
    if (limit.dailyRequests) limit.dailyRequests.push(now);
  }
} 