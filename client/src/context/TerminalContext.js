import React, { createContext, useContext, useState } from 'react';

const TerminalContext = createContext();

export const TerminalProvider = ({ children }) => {
  const [currentSymbol, setCurrentSymbol] = useState('');
  const [securityType, setSecurityType] = useState('');
  const [data, setData] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSymbolChange = async (symbol, type) => {
    const upperSymbol = symbol.toUpperCase();
    
    setCurrentSymbol(upperSymbol);
    setSecurityType(type);
    setIsLoading(true);
    setError(null);

    try {
      const [quoteData, techData, newsData] = await Promise.all([
        fetch(`http://localhost:2008/api/quote/${upperSymbol}?type=${type}`).then(r => r.ok ? r.json() : Promise.reject(new Error('Failed to fetch quote data'))),
        fetch(`http://localhost:2008/api/tech/${upperSymbol}?type=${type}`).then(r => r.ok ? r.json() : Promise.reject(new Error('Failed to fetch technical data'))),
        fetch(`http://localhost:2008/api/news/${upperSymbol}?type=${type}`).then(r => r.ok ? r.json() : Promise.reject(new Error('Failed to fetch news data')))
      ]);

      setData(prevData => ({
        ...prevData,
        [upperSymbol]: {
          quote: quoteData.quote,
          technical: techData.technical,
          news: newsData.news,
          type
        }
      }));

    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <TerminalContext.Provider value={{
      currentSymbol,
      securityType,
      data: data[currentSymbol],
      isLoading,
      error,
      onSymbolChange: handleSymbolChange
    }}>
      {children}
    </TerminalContext.Provider>
  );
};

export const useTerminal = () => useContext(TerminalContext); 