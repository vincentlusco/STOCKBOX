import React, { useState, useRef, useEffect } from 'react';
import { styled } from '@mui/material/styles';
import PropTypes from 'prop-types';
import { 
  formatPrice, 
  formatNumber, 
  formatSentiment,
  formatNews,
  formatLargeNumber
} from '../utils/formatters';
import { routeCommand, AVAILABLE_COMMANDS } from '../utils/commandRouter';
import { detectSecurityType } from '../utils/securityTypeDetector';
import { wsService } from '../services/websocketService';
import { marketData } from '../services/marketData';
import { helpCommands } from '../utils/helpCommands';
import { 
  stockCommands,
  etfCommands,
  optionsCommands,
  cryptoCommands,
  forexCommands,
  futuresCommands,
  bondCommands,
  helpCommands as commandHelpCommands
} from '../utils/commands';

// Helper functions
const formatMarketCap = (num) => {
  if (!num) return null;
  return formatNumber(num) + ' USD';
};

const formatPercent = (value) => {
  if (!value) return 'N/A';
  return `${(value * 100).toFixed(2)}%`;
};

const CommandContainer = styled('div')({
  display: 'flex',
  flexDirection: 'column',
  height: '200px', // Fixed height for command area
  backgroundColor: 'var(--terminal-black)'
});

const OutputContainer = styled('div')({
  flex: 1,
  overflowY: 'scroll',
  padding: '10px',
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

const CommandPrompt = styled('div')({
  display: 'flex',
  alignItems: 'center',
  padding: '5px 10px',
  borderTop: '1px solid var(--terminal-green)'
});

const CommandInput = styled('input')({
  flex: 1,
  backgroundColor: 'transparent',
  border: 'none',
  color: 'var(--terminal-green)',
  fontFamily: 'Courier New, monospace',
  fontSize: '14px',
  padding: '5px',
  '&:focus': {
    outline: 'none'
  }
});

const CommandControls = styled('div')({
  display: 'flex',
  gap: '10px',
  padding: '5px 10px',
  borderTop: '1px solid var(--terminal-green)',
  '& button': {
    backgroundColor: 'transparent',
    border: '1px solid var(--terminal-green)',
    color: 'var(--terminal-green)',
    padding: '2px 8px',
    cursor: 'pointer',
    fontSize: '12px',
    '&:hover': {
      backgroundColor: 'rgba(0, 255, 0, 0.1)'
    }
  }
});

const OutputLine = styled('div')({
  fontFamily: 'Courier New, monospace',
  color: 'var(--terminal-green)',
  marginBottom: '5px',
  whiteSpace: 'pre-wrap'
});

const getYahooSymbol = (symbol, type) => {
  switch (type) {
    case 'FUTURES':
      // Convert TradingView futures symbols to Yahoo format
      if (!symbol.includes('=F')) {
        return `${symbol}=F`;
      }
      return symbol;
      
    case 'FOREX':
      // Convert TradingView FX symbols to Yahoo format
      if (!symbol.includes('=X')) {
        return `${symbol}=X`;
      }
      return symbol;
      
    case 'CRYPTO':
      // Convert TradingView crypto symbols to Yahoo format
      if (!symbol.includes('-USD')) {
        return `${symbol}-USD`;
      }
      return symbol;
      
    default:
      return symbol;
  }
};

const GLOBAL_COMMANDS = ['HELP', 'CLEAR', 'CLS', 'SYMBOL'];

const COMMAND_DESCRIPTIONS = {
  STOCK: {
    PRICE: 'Show current price, change, volume and trading data',
    FA: 'Financial analysis including P/E, margins, growth',
    VOL: 'Volume analysis and trends',
    TECH: 'Technical indicators (RSI, MACD, BB)',
    DES: 'Company description and sector info',
    NEWS: 'Latest news and headlines'
  },
  ETF: {
    PRICE: 'Show current price, NAV, and premium/discount',
    HOLD: 'Holdings breakdown and sector weights',
    VOL: 'Volume and creation/redemption activity',
    TECH: 'Technical indicators for the ETF',
    DES: 'Fund description and strategy'
  },
  CRYPTO: {
    PRICE: 'Current price, 24h change, and market data',
    CHAIN: 'On-chain metrics and network data',
    VOL: 'Volume across exchanges',
    TECH: 'Technical indicators for the token',
    DES: 'Asset description and technology'
  },
  FUTURES: {
    PRICE: 'Current price, settlement, and contract data',
    VOL: 'Volume and open interest analysis',
    TECH: 'Technical indicators for the contract',
    DES: 'Contract specifications'
  }
};

const formatHelpOutput = (securityType) => {
  if (!securityType) {
    return `
STOCKBOX TERMINAL HELP
=====================

Global Commands:
---------------
SYMBOL <ticker>  Set active symbol (e.g., SYMBOL AAPL)
HELP [type]      Show commands (e.g., HELP STOCK)
CLEAR/CLS        Clear terminal output

Security Types and Examples:
--------------------------
STOCK   - Stocks (AAPL, MSFT, GOOGL)
ETF     - ETFs (SPY, QQQ, VTI)
CRYPTO  - Crypto (BTC-USD, ETH-USD)
FUTURES - Futures (ES=F, GC=F, CL=F)
FOREX   - Forex (EURUSD=X, GBPUSD=X)
BONDS   - Bonds (^TNX, ^IRX)
OPTIONS - Options (Format: AAPL230915C00150000)

Type 'HELP <security type>' for specific commands`;
  }

  const upperType = securityType.toUpperCase();
  const commands = AVAILABLE_COMMANDS[upperType];
  if (!commands) {
    return `Unknown security type: ${securityType}`;
  }

  const descriptions = COMMAND_DESCRIPTIONS[upperType] || {};
  
  return `
${upperType} COMMANDS
${'-'.repeat(upperType.length + 9)}
${commands.map(cmd => 
  `${cmd.padEnd(8)} - ${descriptions[cmd] || 'No description available'}`
).join('\n')}

Global Commands:
---------------
${GLOBAL_COMMANDS.join(', ')}`;
};

// Add these helper functions
const getHelpText = (command) => {
  if (!command) {
    return commandHelpCommands.HELP();
  }
  return commandHelpCommands.HELP(command);
};

const formatCommandOutput = (output) => {
  if (typeof output === 'string') {
    return output;
  }
  if (typeof output === 'object') {
    return JSON.stringify(output, null, 2);
  }
  return String(output);
};

const navigateHistory = (direction, currentInput, history, historyIndex) => {
  if (history.length === 0) return { input: currentInput, index: historyIndex };
  
  let newIndex = historyIndex;
  if (direction === 'up') {
    newIndex = Math.min(history.length - 1, historyIndex + 1);
  } else {
    newIndex = Math.max(-1, historyIndex - 1);
  }
  
  const newInput = newIndex === -1 ? '' : history[newIndex];
  return { input: newInput, index: newIndex };
};

// Use commands as before
const commandMap = {
  STOCK: stockCommands,
  ETF: etfCommands,
  OPTIONS: optionsCommands,
  CRYPTO: cryptoCommands,
  FOREX: forexCommands,
  FUTURES: futuresCommands,
  BONDS: bondCommands,
  HELP: commandHelpCommands
};

const TerminalCommand = ({ onSymbolChange }) => {
  const [command, setCommand] = useState('');
  const [commandHistory, setCommandHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [currentSymbol, setCurrentSymbol] = useState('');
  const [securityType, setSecurityType] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const inputRef = useRef(null);

  const handleCommand = async (input) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const [cmd, ...args] = input.trim().toUpperCase().split(' ');
      
      switch (cmd) {
        case 'SYMBOL':
          const symbol = args[0];
          if (!symbol) {
            throw new Error('Please provide a symbol (e.g., SYMBOL AAPL)');
          }
          
          // Try to validate symbol first
          const type = detectSecurityType(symbol);
          try {
            const validationResponse = await fetch(`/api/validate/${symbol}?type=${type}`);
            const validationData = await validationResponse.json();
            
            if (!validationResponse.ok) {
              throw new Error(validationData.error || `Invalid symbol: ${symbol}`);
            }
            
            // If validation passes, set the symbol
            setCurrentSymbol(symbol);
            setSecurityType(type);
            onSymbolChange?.(symbol, type);  // Make onSymbolChange optional
            return `Symbol set to ${symbol} (${type})`;
          } catch (error) {
            if (process.env.NODE_ENV === 'development') {
              // In development, allow setting symbol even if validation fails
              setCurrentSymbol(symbol);
              setSecurityType(type);
              onSymbolChange?.(symbol, type);
              return `Symbol set to ${symbol} (${type}) [DEV MODE]`;
            }
            throw error;
          }

        case 'HELP':
          return getHelpText(securityType);

        case 'CLEAR':
        case 'CLS':
          setCommandHistory([]);
          return '';

        default:
          if (!currentSymbol) {
            throw new Error('No symbol selected. Use SYMBOL <ticker> first');
          }
          
          const data = await marketData.getSecurityData(
            currentSymbol, 
            securityType, 
            cmd
          );
          
          return formatCommandOutput(data);
      }
    } catch (error) {
      setError(error.message);
      return `Error: ${error.message}`;
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = async (e) => {
    if (e.key === 'Enter' && command.trim()) {
      const output = await handleCommand(command);
      setCommandHistory(prev => [...prev, { input: command, output }]);
      setCommand('');
      setHistoryIndex(-1);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const { input, index } = navigateHistory('up', command, commandHistory, historyIndex);
      setCommand(input);
      setHistoryIndex(index);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const { input, index } = navigateHistory('down', command, commandHistory, historyIndex);
      setCommand(input);
      setHistoryIndex(index);
    }
  };

  return (
    <div className="terminal">
      <div className="terminal-history">
        {commandHistory.map((cmd, i) => (
          <div key={i} className="terminal-entry">
            <div className="terminal-input">
              {currentSymbol}> {cmd.input}
            </div>
            <div className="terminal-output">
              {cmd.output}
            </div>
          </div>
        ))}
      </div>

      <div className="terminal-input-line">
        <span className="terminal-prompt">
          {currentSymbol || 'NO SYMBOL'}>
        </span>
        <input
          ref={inputRef}
          type="text"
          value={command}
          onChange={(e) => setCommand(e.target.value)}
          onKeyDown={handleKeyPress}
          disabled={isLoading}
          placeholder={currentSymbol 
            ? "Enter command (type 'HELP' for list)" 
            : "Type 'SYMBOL <ticker>' to start"}
        />
      </div>

      {isLoading && <div className="terminal-loading">Loading...</div>}
      {error && <div className="terminal-error">{error}</div>}
    </div>
  );
};

TerminalCommand.propTypes = {
  onSymbolChange: PropTypes.func.isRequired,
  currentSymbol: PropTypes.string,
  securityType: PropTypes.string,
  data: PropTypes.object,
  isLoading: PropTypes.bool,
  error: PropTypes.string,
  onError: PropTypes.func
};

export default TerminalCommand; 