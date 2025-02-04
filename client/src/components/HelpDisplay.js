import React from 'react';
import { styled } from '@mui/material/styles';

const HelpContainer = styled('div')({
  color: 'var(--terminal-text)',
  padding: '20px',
  fontFamily: 'Courier New, monospace'
});

const HelpSection = styled('div')({
  marginBottom: '30px'
});

const HelpHeader = styled('h2')({
  color: 'var(--terminal-green)',
  borderBottom: '1px solid var(--terminal-green)',
  paddingBottom: '5px'
});

const CommandTable = styled('div')({
  display: 'grid',
  gridTemplateColumns: '200px 1fr',
  gap: '10px',
  margin: '10px 0'
});

const HelpDisplay = () => {
  return (
    <HelpContainer>
      <HelpSection>
        <HelpHeader>COMMAND LINE INTERFACE</HelpHeader>
        <CommandTable>
          <div>quote [symbol]</div>
          <div>Display real-time quote and analysis for any security</div>
          
          <div>tech [symbol]</div>
          <div>Show detailed technical analysis and charts</div>
          
          <div>news [symbol]</div>
          <div>Latest news and sentiment analysis</div>
          
          <div>chain [symbol]</div>
          <div>Options chain with Greeks and volatility data</div>
          
          <div>watch [symbol]</div>
          <div>Add symbol to watchlist</div>
          
          <div>alert [symbol] [price]</div>
          <div>Set price alert for symbol</div>
          
          <div>compare [symbols...]</div>
          <div>Compare multiple securities (e.g., compare AAPL MSFT GOOG)</div>
          
          <div>screen [criteria]</div>
          <div>Screen stocks based on criteria</div>
        </CommandTable>
      </HelpSection>

      <HelpSection>
        <HelpHeader>KEYBOARD SHORTCUTS</HelpHeader>
        <CommandTable>
          <div>Ctrl + Q</div>
          <div>Quick quote lookup</div>
          
          <div>Ctrl + T</div>
          <div>New terminal tab</div>
          
          <div>Ctrl + W</div>
          <div>Close current tab</div>
          
          <div>Ctrl + Space</div>
          <div>Toggle command line</div>
          
          <div>Ctrl + S</div>
          <div>Save current layout</div>
          
          <div>Ctrl + F</div>
          <div>Find in page</div>
        </CommandTable>
      </HelpSection>

      <HelpSection>
        <HelpHeader>DATA CARDS</HelpHeader>
        <p>Each security type displays relevant data cards:</p>
        <CommandTable>
          <div>STOCKS</div>
          <div>Quote, Volume, Technicals, Fundamentals, Trading Range</div>
          
          <div>OPTIONS</div>
          <div>Greeks, Implied Volatility, Open Interest, Volume Analysis</div>
          
          <div>CRYPTO</div>
          <div>Blockchain Data, Network Stats, Exchange Flow, Whale Activity</div>
          
          <div>FUTURES</div>
          <div>Term Structure, Basis, Storage Costs, Delivery Info</div>
          
          <div>FOREX</div>
          <div>Cross Rates, Forward Points, Interest Differentials</div>
          
          <div>BONDS</div>
          <div>Yield Curve, Duration, Convexity, Credit Metrics</div>
        </CommandTable>
      </HelpSection>

      <HelpSection>
        <HelpHeader>ADVANCED FEATURES</HelpHeader>
        <CommandTable>
          <div>Custom Layouts</div>
          <div>Create and save custom workspace layouts</div>
          
          <div>Alerts</div>
          <div>Price, volume, and technical indicator alerts</div>
          
          <div>Screeners</div>
          <div>Create custom stock screens with multiple criteria</div>
          
          <div>Portfolio Analysis</div>
          <div>Risk metrics, correlation analysis, optimization</div>
          
          <div>API Access</div>
          <div>Direct data access via REST API endpoints</div>
        </CommandTable>
      </HelpSection>
    </HelpContainer>
  );
};

export default HelpDisplay; 