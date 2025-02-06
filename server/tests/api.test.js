const request = require('supertest');
const app = require('../start');

describe('API Tests', () => {
  describe('GET /api/test/all-data', () => {
    const testSymbols = ['AAPL', 'TSLA', 'MSFT', 'INVALID'];

    testSymbols.forEach(symbol => {
      it(`returns valid data structure for ${symbol}`, async () => {
        const response = await request(app)
          .get('/api/test/all-data')
          .query({ symbol });

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('basicInfo');
        expect(response.body).toHaveProperty('priceData');
        expect(response.body.basicInfo.symbol).toBe(symbol);
      });
    });

    it('includes all required fields', async () => {
      const response = await request(app)
        .get('/api/test/all-data')
        .query({ symbol: 'AAPL' });

      expect(response.body.basicInfo).toMatchObject({
        symbol: expect.any(String),
        name: expect.any(String),
        exchange: expect.any(String)
      });

      expect(response.body.priceData).toMatchObject({
        currentPrice: expect.any(Number),
        change: expect.any(Number),
        changePercent: expect.any(Number)
      });
    });
  });
}); 