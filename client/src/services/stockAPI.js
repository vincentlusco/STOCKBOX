const BASE_URL = 'http://localhost:2008/api';

// Helper to format security symbols
const formatSymbol = (type, symbol) => {
  switch (type.toUpperCase()) {
    case 'FOREX':
      return symbol.includes('/') ? symbol : `${symbol.slice(0, 3)}/${symbol.slice(3)}`;
    case 'CRYPTO':
      return symbol.startsWith('$') ? symbol.slice(1) : symbol;
    default:
      return symbol;
  }
};

export const fetchSecurityData = async (symbol, type = 'STOCK') => {
  try {
    console.log(`Fetching ${type} data for:`, symbol);

    // Fetch data based on command type
    const [quoteRes, faRes, mktRes] = await Promise.all([
      fetch(`${BASE_URL}/quote/${symbol}?type=${type}`),
      fetch(`${BASE_URL}/fa/${symbol}?type=${type}`),
      fetch(`${BASE_URL}/mkt/${symbol}?type=${type}`)
    ]);

    if (!quoteRes.ok || !faRes.ok || !mktRes.ok) {
      console.error('Response status:', {
        quote: quoteRes.status,
        fa: faRes.status,
        mkt: mktRes.status
      });
      throw new Error('Failed to fetch data');
    }

    const [quote, fa, mkt] = await Promise.all([
      quoteRes.json(),
      faRes.json(),
      mktRes.json()
    ]);

    console.log('API Response:', { quote, fa, mkt });

    return {
      [symbol]: {
        quote: quote.quote,
        fa: fa.financials,
        mkt: mkt.market,
        type
      }
    };
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};