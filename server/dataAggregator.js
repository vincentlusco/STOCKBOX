const TechnicalAnalysis = require('./technicalAnalysis');

class DataAggregator {
    constructor(providers) {
        this.providers = providers;
        this.cache = new Map();
        if (!providers || !providers.primary) {
            throw new Error('Invalid providers configuration');
        }
        this.technicalAnalysis = new TechnicalAnalysis();
    }

    async getCompleteData(symbol, type) {
        const cacheKey = `${symbol}_${type}`;
        if (this.cache.has(cacheKey)) {
            const cached = this.cache.get(cacheKey);
            if (Date.now() - cached.timestamp < 60000) { // 1 minute cache
                return cached.data;
            }
        }

        const data = await this.fetchAllData(symbol, type);
        this.cache.set(cacheKey, {
            timestamp: Date.now(),
            data
        });
        return data;
    }

    async fetchAllData(symbol, type) {
        try {
            // Parallel fetch from all providers
            const [
                yahooData,
                finnhubData,
                secData,
                newsData
            ] = await Promise.allSettled([
                this.providers.primary.quoteSummary(symbol),
                new Promise((resolve, reject) => {
                    this.providers.secondary.finnhub.quote(symbol, (error, data) => {
                        if (error) reject(error);
                        else resolve(data);
                    });
                }),
                type === 'STOCK' ? this.providers.secondary.secApi.getFilings(symbol) : null,
                this.providers.secondary.newsapi.getArticles(symbol)
            ]);

            // Get historical data for technical analysis
            const historicalData = await this.providers.primary.historical(symbol);
            const technicalIndicators = await this.technicalAnalysis
                .calculateIndicators(historicalData.prices, historicalData.volume);

            return {
                marketData: this.mergeMarketData(yahooData, finnhubData),
                fundamentals: this.mergeFundamentalData(yahooData, secData),
                technical: technicalIndicators,
                news: newsData.value,
                timestamp: Date.now()
            };
        } catch (error) {
            console.error('Data aggregation error:', error);
            throw error;
        }
    }

    mergeMarketData(yahoo, finnhub) {
        try {
            const yahooData = yahoo.value || {};  // Handle Promise.allSettled result
            const finnhubData = finnhub.value || {};

            return {
                price: {
                    current: yahooData.price || finnhubData.price,
                    change: yahooData.change || finnhubData.change,
                    changePercent: yahooData.changePercent || finnhubData.changePercent
                },
                volume: {
                    current: yahooData.volume || finnhubData.volume,
                    average: yahooData.averageVolume || finnhubData.averageVolume
                }
            };
        } catch (error) {
            console.error('Error merging market data:', error);
            return {
                price: {},
                volume: {}
            };
        }
    }
}

// Export the class
module.exports = DataAggregator; 