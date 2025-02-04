import React from 'react';
import { styled } from '@mui/material/styles';
import TerminalCommand from './TerminalCommand';
import TradingViewWidget from './TradingViewWidget';
import { useNavigate } from 'react-router-dom';

const TerminalContainer = styled('div')({
  display: 'flex',
  flexDirection: 'column',
  height: '100vh',
  backgroundColor: 'var(--terminal-black)',
  color: 'var(--terminal-green)',
  fontFamily: 'Courier New, monospace'
});

const MainContent = styled('div')({
  display: 'grid',
  gridTemplateColumns: '70% 30%',
  flex: 1,
  overflow: 'hidden'
});

const ChartContainer = styled('div')({
  display: 'flex',
  flexDirection: 'column',
  borderRight: '1px solid var(--terminal-green)',
  height: '100%'
});

const TopBar = styled('div')({
  display: 'flex',
  alignItems: 'center',
  padding: '5px 10px',
  borderBottom: '1px solid var(--terminal-green)',
  height: '30px',
  justifyContent: 'space-between'
});

const Logo = styled('div')({
  color: 'var(--terminal-green)',
  fontWeight: 'bold',
  marginRight: '20px'
});

const SearchInput = styled('input')({
  backgroundColor: 'transparent',
  border: '1px solid var(--terminal-green)',
  color: 'var(--terminal-green)',
  padding: '3px 8px',
  width: '200px',
  '&:focus': {
    outline: 'none',
    borderColor: 'var(--terminal-text)'
  }
});

const ChartSection = styled('div')({
  flex: 1,
  borderBottom: '1px solid var(--terminal-green)'
});

const TimeframeBar = styled('div')({
  display: 'flex',
  gap: '10px',
  padding: '5px 10px',
  borderBottom: '1px solid var(--terminal-green)',
  '& button': {
    backgroundColor: 'transparent',
    border: 'none',
    color: 'var(--terminal-green)',
    cursor: 'pointer',
    '&:hover': {
      textDecoration: 'underline'
    },
    '&.active': {
      color: 'var(--terminal-text)'
    }
  }
});

const DataSection = styled('div')({
  padding: '10px',
  height: '100%'
});

const CommandSection = styled('div')({
  borderTop: '1px solid var(--terminal-green)',
  padding: '10px'
});

const NavButtons = styled('div')({
  display: 'flex',
  gap: '10px'
});

const Button = styled('button')({
  backgroundColor: 'transparent',
  border: '1px solid var(--terminal-green)',
  color: 'var(--terminal-green)',
  padding: '3px 8px',
  cursor: 'pointer',
  fontFamily: 'Courier New, monospace',
  '&:hover': {
    backgroundColor: 'var(--terminal-dim)'
  }
});

const TerminalLayout = ({ children, currentSymbol, onSymbolChange, data }) => {
  const [securityType, setSecurityType] = React.useState('STOCK');
  const [timeframe, setTimeframe] = React.useState('1D');
  const navigate = useNavigate();

  const handleSymbolSearch = (e) => {
    if (e.key === 'Enter') {
      const input = e.target.value.toUpperCase();
      // Parse input for security type
      if (input.includes(':')) {
        const [type, sym] = input.split(':');
        setSecurityType(type);
        onSymbolChange(sym, type);
      } else {
        onSymbolChange(input, 'STOCK');
      }
    }
  };

  const handleQuote = () => {
    navigate(`/quote?symbol=${currentSymbol}`);
  };

  const handleAddToWatchlist = () => {
    // Add to watchlist logic here
    console.log('Adding to watchlist:', currentSymbol);
  };

  return (
    <TerminalContainer>
      <TopBar>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <Logo>STOCKBOX TERMINAL</Logo>
          <NavButtons>
            <Button onClick={() => navigate('/quote')}>QUOTE</Button>
            <Button onClick={() => navigate('/watchlist')}>WATCHLIST</Button>
            <Button onClick={() => navigate('/test')}>TEST</Button>
            <Button onClick={() => navigate('/warren')}>WARREN</Button>
            <Button onClick={() => navigate('/help')}>HELP</Button>
          </NavButtons>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <SearchInput
            placeholder="Enter symbol or TYPE:SYMBOL..."
            onKeyPress={handleSymbolSearch}
          />
          <Button onClick={handleQuote}>GET QUOTE</Button>
          <Button onClick={handleAddToWatchlist}>+ WATCHLIST</Button>
        </div>
      </TopBar>

      <MainContent>
        <ChartContainer>
          <ChartSection>
            <TradingViewWidget symbol={currentSymbol} />
          </ChartSection>
          <TimeframeBar>
            <button className={timeframe === '1m' ? 'active' : ''} onClick={() => setTimeframe('1m')}>1m</button>
            <button className={timeframe === '5m' ? 'active' : ''} onClick={() => setTimeframe('5m')}>5m</button>
            <button className={timeframe === '15m' ? 'active' : ''} onClick={() => setTimeframe('15m')}>15m</button>
            <button className={timeframe === '30m' ? 'active' : ''} onClick={() => setTimeframe('30m')}>30m</button>
            <button className={timeframe === '1h' ? 'active' : ''} onClick={() => setTimeframe('1h')}>1h</button>
            <button className={timeframe === '1D' ? 'active' : ''} onClick={() => setTimeframe('1D')}>1D</button>
            <button className={timeframe === '1W' ? 'active' : ''} onClick={() => setTimeframe('1W')}>1W</button>
            <button className={timeframe === '1M' ? 'active' : ''} onClick={() => setTimeframe('1M')}>1M</button>
          </TimeframeBar>
        </ChartContainer>
        <DataSection>
          {children}
        </DataSection>
      </MainContent>

      <CommandSection>
        <TerminalCommand 
          onCommand={(cmd, args) => {
            if (cmd === 'symbol' || cmd === 's') {
              onSymbolChange(args[0].toUpperCase());
            }
          }}
          data={data}
          currentSymbol={currentSymbol}
        />
      </CommandSection>
    </TerminalContainer>
  );
};

export default TerminalLayout; 