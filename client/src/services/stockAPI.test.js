import { fetchStockData } from './stockAPI';

describe('Stock API Tests', () => {
  it('should fetch TSLA data successfully', async () => {
    const data = await fetchStockData('TSLA');
    console.log('API Response:', data);
    expect(data).toBeTruthy();
  });
}); 