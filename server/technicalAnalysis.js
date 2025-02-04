const technicalIndicators = require('technicalindicators');

class TechnicalAnalysis {
    constructor() {
        this.indicators = {
            SMA: technicalIndicators.SMA,
            EMA: technicalIndicators.EMA,
            RSI: technicalIndicators.RSI,
            MACD: technicalIndicators.MACD,
            BB: technicalIndicators.BollingerBands
        };
    }

    async calculateIndicators(prices, volume) {
        if (!Array.isArray(prices) || prices.length === 0) {
            throw new Error('Invalid price data');
        }

        // Suppress Yahoo Finance warnings
        if (this.providers?.primary?.suppressNotices) {
            this.providers.primary.suppressNotices(['ripHistorical', 'yahooSurvey']);
        }

        // Convert any string numbers to floats
        const numericPrices = prices.map(p => parseFloat(p));
        const numericVolume = volume ? volume.map(v => parseFloat(v)) : null;

        return {
            sma: this.calculateSMA(numericPrices),
            ema: this.calculateEMA(numericPrices),
            rsi: this.calculateRSI(numericPrices),
            macd: this.calculateMACD(numericPrices),
            bb: this.calculateBollingerBands(numericPrices),
            vwap: numericVolume ? this.calculateVWAP(numericPrices, numericVolume) : null
        };
    }

    calculateSMA(prices, period = 14) {
        return this.indicators.SMA.calculate({
            period,
            values: prices
        });
    }

    calculateEMA(prices, period = 14) {
        return this.indicators.EMA.calculate({
            period,
            values: prices
        });
    }

    calculateRSI(prices, period = 14) {
        return this.indicators.RSI.calculate({
            period,
            values: prices
        });
    }

    calculateMACD(prices) {
        return this.indicators.MACD.calculate({
            fastPeriod: 12,
            slowPeriod: 26,
            signalPeriod: 9,
            values: prices
        });
    }

    calculateBollingerBands(prices, period = 20) {
        return this.indicators.BB.calculate({
            period,
            values: prices,
            stdDev: 2
        });
    }

    calculateVWAP(prices, volume) {
        const typicalPrices = prices.map(p => (p.high + p.low + p.close) / 3);
        const vwap = typicalPrices.map((tp, i) => {
            return tp * volume[i];
        }).reduce((a, b) => a + b, 0) / volume.reduce((a, b) => a + b, 0);
        return vwap;
    }
}

module.exports = TechnicalAnalysis; 