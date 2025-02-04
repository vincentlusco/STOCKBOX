const request = require('supertest');
const app = require('../start.js');

describe('Security Data Endpoints', () => {
  describe('GET /api/test/all-data', () => {
    it('should return valid stock data structure', async () => {
      const res = await request(app)
        .get('/api/test/all-data')
        .expect(200);

      expect(res.body).toHaveProperty('symbol');
      expect(res.body).toHaveProperty('price');
      expect(res.body.technicals).toBeDefined();
      expect(res.body.fundamentals).toBeDefined();
    });
  });

  // Test different security types
  const securityTypes = ['STOCK', 'OPTION', 'CRYPTO', 'FOREX', 'FUTURE', 'ETF'];
  
  securityTypes.forEach(type => {
    it(`should return valid ${type} data`, async () => {
      const res = await request(app)
        .get(`/api/test/all-data?type=${type}`)
        .expect(200);

      expect(res.body.securityType).toBe(type);
      // Test type-specific properties
      switch(type) {
        case 'OPTION':
          expect(res.body.optionData).toBeDefined();
          expect(res.body.optionData.strike).toBeDefined();
          break;
        case 'CRYPTO':
          expect(res.body.cryptoData).toBeDefined();
          expect(res.body.cryptoData.circulatingSupply).toBeDefined();
          break;
        // Add other type-specific checks
      }
    });
  });
}); 