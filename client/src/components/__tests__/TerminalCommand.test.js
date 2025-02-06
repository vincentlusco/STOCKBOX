import React from 'react';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TerminalCommand from '../TerminalCommand';

describe('TerminalCommand Integration Tests', () => {
  // Mock data structure matching actual API responses
  const mockData = {
    AAPL: {
      quote: {
        c: 150.00,           // current price
        d: 2.50,             // change
        dp: 1.67,            // change percent
        h: 151.00,           // high
        l: 147.50,           // low
        o: 148.00,           // open
        v: 1000000           // volume
      },
      profile: {
        name: 'Apple Inc.',
        exchange: 'NASDAQ',
        currency: 'USD',
        ipo: '1980-12-12',
        industry: 'Technology',
        sector: 'Technology',
        description: 'Apple Inc. designs, manufactures, and markets smartphones...'
      },
      metrics: {
        peRatio: 25.6,
        forwardPE: 24.2,
        pegRatio: 1.5,
        pbRatio: 12.3,
        eps: 5.89,
        epsGrowth: 15.2,
        revenue: 365.8,       // billions
        revenueGrowth: 8.5
      },
      marketData: {
        float: 15.7,          // billions
        outstanding: 16.5,    // billions
        shortInterest: 45.2,  // millions
        daysToCover: 1.8,
        institutionalOwnership: 72.5,
        insiderOwnership: 0.5,
        beta: 1.2
      }
    }
  };

  const testCases = [
    {
      command: 'HELP',
      expectedContent: ['Available Commands', 'PRICE', 'DES', 'FA']
    },
    {
      command: 'PRICE',
      expectedContent: ['CURRENT:', '150.25', 'VOLUME:', '1000000']
    },
    {
      command: 'DES',
      expectedContent: ['Apple Inc.', 'NASDAQ', 'Technology']
    },
    {
      command: 'INVALID',
      expectedContent: ['Unknown command']
    }
  ];

  // Add more test cases
  const extendedTestCases = [
    ...testCases,
    {
      command: 'FA',
      expectedContent: ['P/E RATIO:', 'EPS:', 'REVENUE:']
    },
    {
      command: 'BS',
      expectedContent: ['TOTAL ASSETS:', 'TOTAL LIABILITIES:', 'CASH:']
    },
    {
      command: 'MKT',
      expectedContent: ['FLOAT:', 'OUTSTANDING:', 'SHORT INTEREST:']
    },
    {
      command: 'S TSLA',
      expectedContent: ['Symbol changed to TSLA']
    }
  ];

  // Helper function to execute commands
  const executeCommand = async (input, command) => {
    await act(async () => {
      await userEvent.type(input, command);
      await userEvent.keyboard('{Enter}');
    });
  };

  it('displays stock price information', async () => {
    await act(async () => {
      render(<TerminalCommand data={mockData} currentSymbol="AAPL" />);
    });
    const input = screen.getByPlaceholderText(/Enter command/i);

    await executeCommand(input, 'PRICE');

    expect(screen.getByText(/CURRENT: \$?150\.00/i)).toBeInTheDocument();
    expect(screen.getByText(/CHANGE: \$?2\.50 \(1\.67%\)/i)).toBeInTheDocument();
    expect(screen.getByText(/VOLUME: 1,000,000/i)).toBeInTheDocument();
  });

  it('displays company description', async () => {
    await act(async () => {
      render(<TerminalCommand data={mockData} currentSymbol="AAPL" />);
    });
    const input = screen.getByPlaceholderText(/Enter command/i);

    await executeCommand(input, 'DES');

    expect(screen.getByText(/Apple Inc\./i)).toBeInTheDocument();
    expect(screen.getByText(/NASDAQ/i)).toBeInTheDocument();
    expect(screen.getByText(/Technology/i)).toBeInTheDocument();
    expect(screen.getByText(/designs, manufactures, and markets/i)).toBeInTheDocument();
  });

  it('handles symbol changes', async () => {
    const onCommand = jest.fn();
    await act(async () => {
      render(<TerminalCommand data={mockData} currentSymbol="AAPL" onCommand={onCommand} />);
    });
    const input = screen.getByPlaceholderText(/Enter command/i);

    await executeCommand(input, 'SYMBOL TSLA');
    expect(onCommand).toHaveBeenCalledWith('symbol', ['TSLA']);
  });

  it('handles missing data gracefully', async () => {
    const emptyData = { AAPL: { quote: {}, profile: {} } };
    await act(async () => {
      render(<TerminalCommand data={emptyData} currentSymbol="AAPL" />);
    });
    const input = screen.getByPlaceholderText(/Enter command/i);

    await executeCommand(input, 'PRICE');
    expect(screen.getByText(/No price data available/i)).toBeInTheDocument();
  });

  it('maintains command history', async () => {
    await act(async () => {
      render(<TerminalCommand data={mockData} currentSymbol="AAPL" />);
    });
    const input = screen.getByPlaceholderText(/Enter command/i);

    const commands = ['PRICE', 'DES', 'HELP'];
    for (const cmd of commands) {
      await executeCommand(input, cmd);
    }

    // Test history navigation
    for (let i = commands.length - 1; i >= 0; i--) {
      await act(async () => {
        await userEvent.keyboard('{ArrowUp}');
      });
      expect(input.value).toBe(commands[i]);
    }
  });

  it('recognizes command shortcuts', async () => {
    await act(async () => {
      render(<TerminalCommand data={mockData} currentSymbol="AAPL" />);
    });
    const input = screen.getByPlaceholderText(/Enter command/i);

    const shortcuts = [
      { cmd: 'H', expected: 'Available commands' },
      { cmd: 'P', expected: 'CURRENT:' }
    ];

    for (const { cmd, expected } of shortcuts) {
      await executeCommand(input, cmd);
      expect(await screen.findByText(new RegExp(expected, 'i'))).toBeInTheDocument();
    }
  });

  it('displays financial analysis data', async () => {
    await act(async () => {
      render(<TerminalCommand data={mockData} currentSymbol="AAPL" />);
    });
    const input = screen.getByPlaceholderText(/Enter command/i);

    await executeCommand(input, 'FA');

    expect(screen.getByText(/P\/E RATIO: 25\.6/i)).toBeInTheDocument();
    expect(screen.getByText(/FORWARD P\/E: 24\.2/i)).toBeInTheDocument();
    expect(screen.getByText(/PEG RATIO: 1\.5/i)).toBeInTheDocument();
    expect(screen.getByText(/EPS: \$?5\.89/i)).toBeInTheDocument();
    expect(screen.getByText(/EPS GROWTH: 15\.2%/i)).toBeInTheDocument();
    expect(screen.getByText(/REVENUE: \$365\.8B/i)).toBeInTheDocument();
  });

  it('displays market data', async () => {
    await act(async () => {
      render(<TerminalCommand data={mockData} currentSymbol="AAPL" />);
    });
    const input = screen.getByPlaceholderText(/Enter command/i);

    await executeCommand(input, 'MKT');

    expect(screen.getByText(/FLOAT: 15\.7B shares/i)).toBeInTheDocument();
    expect(screen.getByText(/OUTSTANDING: 16\.5B shares/i)).toBeInTheDocument();
    expect(screen.getByText(/SHORT INTEREST: 45\.2M shares/i)).toBeInTheDocument();
    expect(screen.getByText(/DAYS TO COVER: 1\.8/i)).toBeInTheDocument();
    expect(screen.getByText(/INST OWNERSHIP: 72\.5%/i)).toBeInTheDocument();
    expect(screen.getByText(/BETA: 1\.2/i)).toBeInTheDocument();
  });

  it('handles missing financial data gracefully', async () => {
    const emptyData = { 
      AAPL: { 
        quote: {}, 
        profile: {},
        metrics: {},
        marketData: {} 
      } 
    };
    
    await act(async () => {
      render(<TerminalCommand data={emptyData} currentSymbol="AAPL" />);
    });
    const input = screen.getByPlaceholderText(/Enter command/i);

    await executeCommand(input, 'FA');
    expect(screen.getByText(/P\/E RATIO: undefined/i)).toBeInTheDocument();
    expect(screen.getByText(/REVENUE: \$NaNB/i)).toBeInTheDocument();

    await executeCommand(input, 'MKT');
    expect(screen.getByText(/FLOAT: NaNB shares/i)).toBeInTheDocument();
    expect(screen.getByText(/BETA: undefined/i)).toBeInTheDocument();
  });
}); 