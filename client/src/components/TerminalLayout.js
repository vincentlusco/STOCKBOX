import React from 'react';
import { styled } from '@mui/material/styles';
import TerminalCommand from './TerminalCommand';
import TradingViewWidget from './TradingViewWidget';
import { useNavigate, useLocation } from 'react-router-dom';
import ErrorBoundary from './ErrorBoundary';
import PropTypes from 'prop-types';
import { useTerminal } from '../context/TerminalContext';
import { Box, AppBar, Toolbar, Button, Typography } from '@mui/material';

const TerminalContainer = styled('div')({
  display: 'flex',
  flexDirection: 'column',
  height: '100vh',
  backgroundColor: 'var(--terminal-dim)',
  color: 'var(--terminal-text)'
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
  minHeight: 0,
  backgroundColor: 'var(--terminal-black)'
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
  flex: '0 0 300px',
  borderTop: '1px solid var(--terminal-green)',
  padding: '10px',
  backgroundColor: 'var(--terminal-black)'
});

const NavButtons = styled('div')({
  display: 'flex',
  gap: '10px'
});

const ButtonStyled = styled('button')({
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

const TerminalLayout = ({ onSymbolChange }) => {
  const { currentSymbol, securityType, data, isLoading, error } = useTerminal();

  return (
    <ErrorBoundary>
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
        <AppBar position="static">
          <Toolbar>
            <Logo>Terminal</Logo>
            <SearchInput />
          </Toolbar>
        </AppBar>
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <TerminalCommand
            onSymbolChange={onSymbolChange}
            currentSymbol={currentSymbol}
            securityType={securityType}
            data={data}
            isLoading={isLoading}
            error={error}
          />
        </Box>
      </Box>
    </ErrorBoundary>
  );
};

TerminalLayout.propTypes = {
  onSymbolChange: PropTypes.func
};

TerminalLayout.defaultProps = {
  onSymbolChange: () => {} // Provide default no-op function
};

export default TerminalLayout; 