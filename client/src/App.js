import React from 'react';
import { 
  createBrowserRouter, 
  RouterProvider,
  createRoutesFromElements,
  Route,
  Navigate
} from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material';
import { TerminalProvider } from './context/TerminalContext';
import TerminalLayout from './components/TerminalLayout';
import WatchlistPage from './pages/WatchlistPage';
import TestPage from './pages/TestPage';
import WarrenPage from './pages/WarrenPage';
import HelpPage from './pages/HelpPage';
import ErrorBoundary from './components/ErrorBoundary';
import ErrorPage from './components/ErrorPage';
import TerminalCommand from './components/TerminalCommand';
import { marketData } from './services/marketData';
import './App.css';

// Create a dark theme
const darkTheme = createTheme({
    palette: {
        mode: 'dark',
        primary: {
            main: '#90caf9'
        }
    }
});

const App = () => {
  const handleSymbolChange = (symbol, type) => {
    console.log(`Symbol changed to ${symbol} (${type})`);
    // Add any additional symbol change handling here
  };

  return (
    <ThemeProvider theme={darkTheme}>
      <TerminalProvider>
        <RouterProvider 
          router={createBrowserRouter(
            createRoutesFromElements(
              <Route errorElement={<ErrorPage />}>
                <Route path="/" element={<Navigate to="/quote" replace />} />
                <Route path="/quote" element={<TerminalLayout onSymbolChange={handleSymbolChange} />} />
                <Route path="/watchlist" element={<WatchlistPage />} />
                <Route path="/test" element={<TestPage />} />
                <Route path="/warren" element={<WarrenPage />} />
                <Route path="/help" element={<HelpPage />} />
              </Route>
            )
          )} 
        />
        <TerminalCommand onSymbolChange={handleSymbolChange} />
      </TerminalProvider>
    </ThemeProvider>
  );
};

export default App;
