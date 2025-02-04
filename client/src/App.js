import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material';
import Layout from './components/Layout';
import QuotePage from './pages/QuotePage';
import WatchlistPage from './pages/WatchlistPage';
import TestPage from './pages/TestPage';
import WarrenPage from './pages/WarrenPage';

// Create a dark theme
const darkTheme = createTheme({
    palette: {
        mode: 'dark',
        primary: {
            main: '#90caf9'
        }
    }
});

function App() {
    return (
        <ThemeProvider theme={darkTheme}>
            <BrowserRouter>
                <Layout>
                    <Routes>
                        <Route path="/" element={<Navigate to="/quote" replace />} />
                        <Route path="/quote" element={<QuotePage />} />
                        <Route path="/watchlist" element={<WatchlistPage />} />
                        <Route path="/test" element={<TestPage />} />
                        <Route path="/warren" element={<WarrenPage />} />
                    </Routes>
                </Layout>
            </BrowserRouter>
        </ThemeProvider>
    );
}

export default App;
