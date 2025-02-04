import React from 'react';
import { styled } from '@mui/material/styles';

const HelpContainer = styled('div')({
  padding: '20px',
  color: 'var(--terminal-green)',
  fontFamily: 'Courier New, monospace',
  backgroundColor: 'var(--terminal-black)',
  minHeight: '100vh'
});

const Section = styled('div')({
  marginBottom: '30px'
});

const Title = styled('h2')({
  color: 'var(--terminal-green)',
  borderBottom: '1px solid var(--terminal-green)',
  paddingBottom: '10px',
  marginBottom: '20px'
});

const CommandTable = styled('table')({
  width: '100%',
  borderCollapse: 'collapse',
  '& th, & td': {
    padding: '10px',
    textAlign: 'left',
    borderBottom: '1px solid rgba(0, 255, 0, 0.1)'
  },
  '& th': {
    color: '#4CAF50',
    fontWeight: 'bold'
  }
});

const HelpPage = () => {
  const commands = {
    'Navigation Commands': [
      { command: 'HELP', syntax: 'HELP', description: 'Display this help screen' },
      { command: 'CLEAR', syntax: 'CLEAR or CLS', description: 'Clear the terminal output' }
    ],
    'Symbol Commands': [
      { command: 'S', syntax: 'S AAPL', description: 'Change current symbol' },
      { command: 'SYMBOL', syntax: 'SYMBOL AAPL', description: 'Change current symbol (alias)' }
    ],
    'Quote Commands': [
      { command: 'DES', syntax: 'DES', description: 'Display security description and basic info' },
      { command: 'PRICE', syntax: 'PRICE', description: 'Show detailed price information' },
      { command: 'FA', syntax: 'FA', description: 'Display financial analysis and ratios' },
      { command: 'BS', syntax: 'BS', description: 'Show balance sheet summary' },
      { command: 'MKT', syntax: 'MKT', description: 'Display market data and trading statistics' }
    ],
    'Chart Commands': [
      { command: '1M', syntax: '1M', description: 'Set chart timeframe to 1 minute' },
      { command: '5M', syntax: '5M', description: 'Set chart timeframe to 5 minutes' },
      { command: '15M', syntax: '15M', description: 'Set chart timeframe to 15 minutes' },
      { command: '30M', syntax: '30M', description: 'Set chart timeframe to 30 minutes' },
      { command: '1H', syntax: '1H', description: 'Set chart timeframe to 1 hour' },
      { command: '1D', syntax: '1D', description: 'Set chart timeframe to 1 day' },
      { command: '1W', syntax: '1W', description: 'Set chart timeframe to 1 week' },
      { command: '1MO', syntax: '1MO', description: 'Set chart timeframe to 1 month' }
    ],
    'Security Types': [
      { command: 'STOCK:', syntax: 'STOCK:AAPL', description: 'Specify stock symbol' },
      { command: 'CRYPTO:', syntax: 'CRYPTO:BTC', description: 'Specify cryptocurrency' },
      { command: 'FOREX:', syntax: 'FOREX:EURUSD', description: 'Specify forex pair' }
    ]
  };

  return (
    <HelpContainer>
      <Section>
        <Title>STOCKBOX TERMINAL HELP</Title>
        <p>Welcome to StockBox Terminal. Below are all available commands and their usage.</p>
      </Section>

      {Object.entries(commands).map(([category, commandList]) => (
        <Section key={category}>
          <Title>{category}</Title>
          <CommandTable>
            <thead>
              <tr>
                <th>Command</th>
                <th>Syntax</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              {commandList.map((cmd, index) => (
                <tr key={index}>
                  <td style={{ color: '#4CAF50' }}>{cmd.command}</td>
                  <td>{cmd.syntax}</td>
                  <td>{cmd.description}</td>
                </tr>
              ))}
            </tbody>
          </CommandTable>
        </Section>
      ))}

      <Section>
        <Title>Examples</Title>
        <pre>
          {`
  > HELP                    # Show this help screen
  > S AAPL                  # Switch to Apple Inc.
  > DES                     # Show Apple's description
  > CRYPTO:BTC             # Switch to Bitcoin
  > FA                      # Show financial analysis
  > CLEAR                   # Clear terminal output
          `.trim()}
        </pre>
      </Section>

      <Section>
        <Title>Keyboard Shortcuts</Title>
        <CommandTable>
          <tbody>
            <tr>
              <td>Enter</td>
              <td>Execute command</td>
            </tr>
            <tr>
              <td>Up/Down</td>
              <td>Navigate command history</td>
            </tr>
            <tr>
              <td>Esc</td>
              <td>Clear current command</td>
            </tr>
          </tbody>
        </CommandTable>
      </Section>
    </HelpContainer>
  );
};

export default HelpPage; 