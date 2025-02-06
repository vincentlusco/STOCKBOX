const axios = require('axios');

class NewsService {
  constructor() {
    this.apiKey = process.env.NEWS_API_KEY;
    if (!this.apiKey) {
      console.error('[News] No API key found in environment variables');
      throw new Error('NEWS_API_KEY is required');
    }
    
    console.log('[News] Initialized with API key:', this.apiKey.slice(0, 4) + '...');
    
    this.baseUrl = 'https://newsapi.org/v2/everything';
    this.headers = {
      'X-Api-Key': this.apiKey,
      'Accept': 'application/json'
    };
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
    this.fallbackNews = [
      {
        title: "Market data temporarily unavailable",
        description: "Live news feed is currently unavailable. Please try again later.",
        url: "#",
        publishedAt: new Date().toISOString(),
        source: { name: "System" }
      }
    ];
  }

  async getNews(symbol, type) {
    try {
      // Check cache first
      const cacheKey = `${symbol}-${type}`;
      const cached = this.cache.get(cacheKey);
      
      if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
        console.log(`[News] Using cached data for ${symbol}`);
        return cached.data;
      }

      // Try to fetch fresh data
      console.log(`[News] Fetching fresh data for ${symbol}`);
      const news = await this.fetchNewsWithRetry(symbol);
      
      // Cache the successful result
      if (news !== this.fallbackNews) {
        this.cache.set(cacheKey, {
          timestamp: Date.now(),
          data: news
        });
      }

      return news;
    } catch (error) {
      console.error('[News] Service error:', error.message);
      return this.fallbackNews;
    }
  }

  async fetchNewsWithRetry(symbol, retries = 2) {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        console.log(`[News] Attempt ${attempt} for ${symbol}`);
        
        const response = await axios.get(this.baseUrl, {
          headers: this.headers,
          params: {
            q: symbol,
            language: 'en',
            sortBy: 'publishedAt',
            pageSize: 10
          },
          timeout: 3000 * attempt
        });

        if (response.status === 200 && response.data.articles?.length > 0) {
          return response.data.articles.map(article => ({
            title: article.title,
            description: article.description,
            url: article.url,
            publishedAt: article.publishedAt,
            source: article.source
          }));
        }

        throw new Error('No articles in response');
      } catch (error) {
        console.warn(`[News] Attempt ${attempt} failed:`, error.message);
        if (attempt === retries) throw error;
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }
  }

  clearCache() {
    this.cache.clear();
    console.log('[News] Cache cleared');
  }

  static analyzeSentiment(text) {
    // Simple sentiment analysis - can be enhanced with proper NLP
    const positiveWords = ['up', 'gain', 'positive', 'bull', 'grow', 'profit'];
    const negativeWords = ['down', 'loss', 'negative', 'bear', 'drop', 'decline'];
    
    const words = text.toLowerCase().split(' ');
    const positive = words.filter(w => positiveWords.includes(w)).length;
    const negative = words.filter(w => negativeWords.includes(w)).length;
    
    return {
      score: (positive - negative) / (positive + negative || 1),
      positive,
      negative
    };
  }
}

module.exports = new NewsService(); 