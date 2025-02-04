import React from 'react';
import { styled } from '@mui/material/styles';

const DataContainer = styled('pre')({
  color: 'var(--terminal-green)',
  fontFamily: 'Courier New, monospace',
  padding: '20px',
  margin: 0,
  overflowY: 'scroll',
  height: 'calc(100vh - 400px)',
  backgroundColor: 'var(--terminal-black)',
  whiteSpace: 'pre-wrap',
  fontSize: '14px',
  '&::-webkit-scrollbar': {
    width: '8px'
  },
  '&::-webkit-scrollbar-track': {
    background: 'var(--terminal-black)'
  },
  '&::-webkit-scrollbar-thumb': {
    background: 'var(--terminal-green)',
    borderRadius: '4px'
  }
});

const LoadingIndicator = styled('div')({
  animation: 'blink 1s infinite',
  '@keyframes blink': {
    '0%': { opacity: 0 },
    '50%': { opacity: 1 },
    '100%': { opacity: 0 }
  }
});

const SecurityDisplay = ({ data, isLoading, error }) => {
  if (isLoading) return (
    <DataContainer>
      <LoadingIndicator>
        Fetching data for {data?.basicInfo?.symbol || 'unknown'}...
        <br />
        Last update: {new Date().toLocaleTimeString()}
      </LoadingIndicator>
    </DataContainer>
  );

  if (error) return (
    <DataContainer>
      Error: {error}
    </DataContainer>
  );

  const formatValue = (value) => {
    if (typeof value === 'number') {
      if (Math.abs(value) >= 1e9) {
        return `${(value / 1e9).toFixed(2)}B`;
      }
      if (Math.abs(value) >= 1e6) {
        return `${(value / 1e6).toFixed(2)}M`;
      }
      return value.toFixed(2);
    }
    return value;
  };

  const renderSection = (title, data) => {
    if (!data || Object.keys(data).length === 0) return null;
    return (
      <>
        <div style={{ color: '#4CAF50', marginTop: '15px', marginBottom: '5px' }}>
          {title}:
        </div>
        {Object.entries(data).map(([key, value]) => (
          <div key={key} style={{ marginLeft: '20px', marginBottom: '2px' }}>
            {key}: {formatValue(value)}
          </div>
        ))}
      </>
    );
  };

  return (
    <DataContainer>
      <div style={{ marginBottom: '15px', color: '#4CAF50' }}>
        Data as of: {new Date().toLocaleTimeString()}
      </div>
      
      {renderSection('Basic Info', data.basicInfo)}
      {renderSection('Price Data', data.priceData)}
      {renderSection('Fundamentals', data.fundamentals)}
      {renderSection('Market Data', data.marketData)}
      {renderSection('Balance Sheet', data.balanceSheet)}
      
      <div style={{ marginTop: '20px', color: '#666' }}>
        Source: StockBox Terminal
      </div>
    </DataContainer>
  );
};

export default SecurityDisplay; 