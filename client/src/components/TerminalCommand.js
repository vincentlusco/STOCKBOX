import React, { useState, useRef, useEffect } from 'react';
import { styled } from '@mui/material/styles';

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

const COMMANDS = {
  'HELP': {
    description: 'Show available commands',
    usage: 'HELP',
    action: (args, setOutput) => {
      const helpText = Object.entries(COMMANDS)
        .map(([cmd, info]) => `${cmd.padEnd(10)} - ${info.description}`)
        .join('\n');
      setOutput(helpText);
    }
  },
  'DES': {
    description: 'Display security description and basic info',
    usage: 'DES [symbol]',
    action: (args, setOutput, data) => {
      const basicInfo = data?.basicInfo || {};
      setOutput(`
DESCRIPTION: ${basicInfo.name}
EXCHANGE: ${basicInfo.exchange}
SECTOR: ${basicInfo.sector}
INDUSTRY: ${basicInfo.industry}
CURRENCY: ${basicInfo.currency}
TRADING HOURS: ${basicInfo.tradingHours}
      `);
    }
  },
  'PRICE': {
    description: 'Show detailed price information',
    usage: 'PRICE [symbol]',
    action: (args, setOutput, data) => {
      const price = data?.priceData || {};
      setOutput(`
CURRENT: ${price.currentPrice}
CHANGE: ${price.change} (${price.changePercent}%)
BID: ${price.bid} x ${price.bidSize}
ASK: ${price.ask} x ${price.askSize}
OPEN: ${price.open}
HIGH: ${price.high}
LOW: ${price.low}
VOLUME: ${price.volume}
      `);
    }
  },
  'FA': {
    description: 'Financial analysis and ratios',
    usage: 'FA [symbol]',
    action: (args, setOutput, data) => {
      const fundamentals = data?.fundamentals || {};
      setOutput(`
P/E RATIO: ${fundamentals.pe}
FORWARD P/E: ${fundamentals.forwardPE}
PEG RATIO: ${fundamentals.peg}
P/B RATIO: ${fundamentals.pb}
EPS: ${fundamentals.eps}
EPS GROWTH: ${fundamentals.epsGrowth}%
REVENUE: $${(fundamentals.revenue / 1e9).toFixed(2)}B
REVENUE GROWTH: ${fundamentals.revenueGrowth}%
      `);
    }
  },
  'BS': {
    description: 'Balance sheet summary',
    usage: 'BS [symbol]',
    action: (args, setOutput, data) => {
      const balance = data?.balanceSheet || {};
      setOutput(`
TOTAL ASSETS: $${(balance.totalAssets / 1e9).toFixed(2)}B
TOTAL LIABILITIES: $${(balance.totalLiabilities / 1e9).toFixed(2)}B
CASH: $${(balance.cashAndEquivalents / 1e9).toFixed(2)}B
DEBT: $${(balance.totalDebt / 1e9).toFixed(2)}B
CURRENT RATIO: ${balance.currentRatio}
QUICK RATIO: ${balance.quickRatio}
      `);
    }
  },
  'MKT': {
    description: 'Market data and trading statistics',
    usage: 'MKT [symbol]',
    action: (args, setOutput, data) => {
      const market = data?.marketData || {};
      setOutput(`
FLOAT: ${(market.sharesFloat / 1e9).toFixed(2)}B shares
OUTSTANDING: ${(market.sharesOutstanding / 1e9).toFixed(2)}B shares
SHORT INTEREST: ${(market.shortInterest / 1e6).toFixed(2)}M shares
DAYS TO COVER: ${market.daysToCover}
INST OWNERSHIP: ${market.institutionalOwnership}%
INSIDER OWNERSHIP: ${market.insiderOwnership}%
BETA: ${market.beta}
      `);
    }
  }
};

const TerminalCommand = ({ onCommand, data, currentSymbol }) => {
  const [command, setCommand] = useState('');
  const [commandHistory, setCommandHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [outputHistory, setOutputHistory] = useState([]);
  const outputRef = useRef(null);

  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [outputHistory]);

  const addToHistory = (cmd, output) => {
    const timestamp = new Date().toLocaleTimeString();
    setOutputHistory(prev => [...prev, {
      timestamp,
      command: cmd,
      output,
      symbol: currentSymbol
    }]);
    setCommandHistory(prev => [...prev, cmd]);
    setHistoryIndex(-1);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && command.trim()) {
      const [cmd, ...args] = command.trim().toUpperCase().split(' ');
      
      if (COMMANDS[cmd]) {
        let output = '';
        COMMANDS[cmd].action(args, (text) => {
          output = text;
        }, data);
        addToHistory(command, output);
      } else if (cmd === 'CLEAR' || cmd === 'CLS') {
        setOutputHistory([]);
      } else {
        addToHistory(command, `Unknown command: ${cmd}\nType HELP for available commands`);
      }
      
      setCommand('');
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (historyIndex < commandHistory.length - 1) {
        const newIndex = historyIndex + 1;
        setHistoryIndex(newIndex);
        setCommand(commandHistory[commandHistory.length - 1 - newIndex]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setCommand(commandHistory[commandHistory.length - 1 - newIndex]);
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setCommand('');
      }
    }
  };

  const clearHistory = () => {
    setOutputHistory([]);
  };

  const clearCommandHistory = () => {
    setCommandHistory([]);
    setHistoryIndex(-1);
  };

  return (
    <CommandContainer>
      <OutputContainer ref={outputRef}>
        {outputHistory.map((entry, index) => (
          <div key={index}>
            <OutputLine style={{ color: '#666' }}>
              [{entry.timestamp}] {entry.symbol}> {entry.command}
            </OutputLine>
            <OutputLine>{entry.output}</OutputLine>
          </div>
        ))}
      </OutputContainer>
      
      <CommandControls>
        <button onClick={clearHistory}>Clear Output</button>
        <button onClick={clearCommandHistory}>Clear History</button>
        <span style={{ marginLeft: 'auto', color: '#666' }}>
          {commandHistory.length} commands in history
        </span>
      </CommandControls>

      <CommandPrompt>
        <span style={{ color: 'var(--terminal-green)', marginRight: '10px' }}>
          {currentSymbol || 'NO SYMBOL'}>{' '}
        </span>
        <CommandInput
          value={command}
          onChange={(e) => setCommand(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder={`Enter command (type 'HELP' for list of commands) - Current: ${currentSymbol || 'NONE'}`}
        />
      </CommandPrompt>
    </CommandContainer>
  );
};

export default TerminalCommand; 