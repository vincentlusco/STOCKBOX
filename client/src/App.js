import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material';
import Layout from './components/Layout';
import QuotePage from './pages/QuotePage';
import WatchlistPage from './pages/WatchlistPage';
import TestPage from './pages/TestPage';
import WarrenPage from './pages/WarrenPage';
import TerminalLayout from './components/TerminalLayout';
import SecurityDisplay from './components/SecurityDisplay';
import HelpPage from './pages/HelpPage';
import { cacheSymbolData, getCachedSymbolData } from './utils/symbolCache';

// Create a dark theme
const darkTheme = createTheme({
    palette: {
        mode: 'dark',
        primary: {
            main: '#90caf9'
        }
    }
});

// Sample data for testing different security types
const sampleData = {
  // Common data for all securities
  symbol: 'AAPL',
  securityType: 'STOCK', // STOCK, OPTION, CRYPTO, FOREX, FUTURE, ETF, BOND
  price: 185.85,
  change: -2.15,
  changePercent: -1.15,
  bid: 185.80,
  ask: 185.90,
  bidSize: 500,
  askSize: 700,
  volume: 55892310,
  avgVolume: 52145000,
  vwap: 185.92,
  open: 187.15,
  high: 187.33,
  low: 184.21,
  previousClose: 188.00,
  marketCap: 3.02e12,
  
  // Technical data
  technicals: {
    rsi: 45.67,
    macd: -0.15,
    signal: 0.22,
    bbUpper: 190.25,
    bbLower: 182.15,
    sma20: 186.42,
    sma50: 182.35,
    ema9: 185.75,
    ema21: 184.90,
    adx: 22.5,
    plusDI: 18.2,
    minusDI: 25.4,
    cci: -85.5,
    stochK: 35.2,
    stochD: 42.1,
    williamsR: -65.8,
    moneyFlowIndex: 42.5,
    obv: 125000000
  },

  // Stock-specific data
  fundamentals: {
    pe: 31.25,
    forwardPE: 28.5,
    peg: 2.1,
    pb: 45.2,
    ps: 7.8,
    eps: 5.89,
    dividendYield: 0.51
  },

  // ETF-specific data
  etfData: {
    category: 'Technology',
    aum: 255.2e9,
    expenseRatio: 0.15,
    totalHoldings: 505,
    topHoldings: [
      { symbol: 'AAPL', weight: 7.2 },
      { symbol: 'MSFT', weight: 6.8 },
      { symbol: 'AMZN', weight: 3.4 }
    ],
    sectorWeights: [
      { sector: 'Technology', weight: 28.5 },
      { sector: 'Healthcare', weight: 15.2 },
      { sector: 'Financials', weight: 13.1 }
    ],
    tracking: 'S&P 500',
    premium: 0.02,
    nav: 452.15
  },

  // Option-specific data
  optionData: {
    type: 'CALL',
    strike: 190.00,
    expiration: '2024-03-15',
    daysToExpiry: 45,
    inTheMoney: false,
    openInterest: 15420,
    volume: 3250,
    impliedVolatility: 22.5,
    delta: 0.45,
    gamma: 0.02,
    theta: -0.15,
    vega: 0.35,
    rho: 0.12,
    theoreticalValue: 3.25
  },

  // Crypto-specific data
  cryptoData: {
    marketCap: 825.4e9,
    circulatingSupply: 19458625,
    maxSupply: 21000000,
    volume24h: 28.5e9,
    hashrate: '450 EH/s',
    networkDifficulty: 72.35e12,
    blockTime: 9.8,
    blockReward: 6.25,
    activeAddresses: 1250000,
    transactionFee: 12.5,
    mempool: 15420
  },

  // Forex-specific data
  forexData: {
    baseCurrency: 'EUR',
    quoteCurrency: 'USD',
    interestRateDiff: 1.25,
    forwardPoints: {
      oneMonth: -12.5,
      threeMonth: -38.2,
      oneYear: -155.4
    },
    crossRates: [
      { pair: 'EUR/GBP', rate: 0.8525 },
      { pair: 'EUR/JPY', rate: 158.25 },
      { pair: 'EUR/CHF', rate: 0.9525 }
    ],
    swapPoints: -2.35,
    centralParityRate: 1.1850
  },

  // Future-specific data
  futureData: {
    contractSize: 1000,
    deliveryDate: '2024-06-21',
    firstNotice: '2024-06-14',
    basis: -0.25,
    contango: true,
    carryCost: 2.15,
    rollYield: -1.25,
    openInterest: 125400,
    deliveryPoint: 'Cushing, Oklahoma',
    storageRate: 0.35,
    qualitySpread: 0.15
  }
};

const validateSymbol = (symbol) => {
  // Basic validation rules
  if (!symbol) return false;
  if (symbol.length > 10) return false;
  if (!/^[A-Z0-9.:^-]+$/.test(symbol)) return false;
  return true;
};

const fetchAllSecurityData = async (symbol) => {
  try {
    // Check cache first
    const cached = getCachedSymbolData(symbol);
    if (cached) return cached;
    
    // Validate symbol
    if (!validateSymbol(symbol)) {
      throw new Error('Invalid symbol format');
    }

    // Use relative URL with proxy
    const response = await fetch(`/api/test/all-data?symbol=${symbol}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch data: ${response.statusText}`);
    }
    const data = await response.json();
    
    // Cache the result
    cacheSymbolData(symbol, data);
    return data;
  } catch (error) {
    console.error('Error fetching security data:', error);
    throw error;
  }
};

function App() {
    const [securityData, setSecurityData] = React.useState(sampleData);
    const [isLoading, setIsLoading] = React.useState(false);
    const [error, setError] = React.useState(null);
    const [currentSymbol, setCurrentSymbol] = React.useState('AAPL');
    const [retryCount, setRetryCount] = React.useState(0);
    const MAX_RETRIES = 3;

    const handleSymbolChange = (newSymbol, type = 'STOCK') => {
        try {
            if (!validateSymbol(newSymbol)) {
                setError('Invalid symbol format');
                return;
            }
            setCurrentSymbol(newSymbol);
        } catch (err) {
            setError(err.message);
        }
    };

    React.useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const data = await fetchAllSecurityData(currentSymbol);
                if (data) {
                    setSecurityData(data);
                    setRetryCount(0);
                }
            } catch (err) {
                if (retryCount < MAX_RETRIES) {
                    setRetryCount(prev => prev + 1);
                    setTimeout(fetchData, 1000 * (retryCount + 1));
                } else {
                    setError(err.message);
                }
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
        const interval = setInterval(fetchData, 5000);
        return () => clearInterval(interval);
    }, [currentSymbol, retryCount]);

    return (
        <ThemeProvider theme={darkTheme}>
            <BrowserRouter>
                <Routes>
                    <Route path="/" element={<Navigate to="/quote" replace />} />
                    <Route path="/quote" element={
                        <TerminalLayout 
                            currentSymbol={currentSymbol}
                            onSymbolChange={handleSymbolChange}
                        >
                            <SecurityDisplay 
                                data={securityData}
                                isLoading={isLoading}
                                error={error}
                            />
                        </TerminalLayout>
                    } />
                    <Route path="/watchlist" element={<WatchlistPage />} />
                    <Route path="/test" element={<TestPage />} />
                    <Route path="/warren" element={<WarrenPage />} />
                    <Route path="/help" element={<HelpPage />} />
                </Routes>
            </BrowserRouter>
        </ThemeProvider>
    );
}

export default App;
