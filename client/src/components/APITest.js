import { useEffect } from 'react';

const APITest = () => {
  useEffect(() => {
    const testAPI = async () => {
      try {
        const response = await fetch('http://localhost:2008/api/finnhub/quote?symbol=AAPL');
        console.log('Response status:', response.status);
        const data = await response.json();
        console.log('Test Data:', data);
      } catch (error) {
        console.error('Test failed:', error);
      }
    };

    testAPI();
  }, []);

  return null;
};

export default APITest; 