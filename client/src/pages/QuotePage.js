import React, { useState } from 'react';
import { Box, TextField, Button, Grid, Paper, Typography, CircularProgress } from '@mui/material';
import TradingViewWidget from '../components/TradingViewWidget';

const QuotePage = () => {
    const [symbol, setSymbol] = useState('');
    const [quoteData, setQuoteData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleQuote = async () => {
        if (!symbol) return;
        
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`/api/quote/${symbol}`);
            if (!response.ok) {
                throw new Error('Failed to fetch quote data');
            }
            const data = await response.json();
            setQuoteData(data);
        } catch (error) {
            console.error('Error fetching quote:', error);
            setError(error.message);
            setQuoteData(null);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box p={3}>
            <Grid container spacing={3}>
                {/* Search Section */}
                <Grid item xs={12}>
                    <Paper elevation={3} sx={{ p: 2 }}>
                        <TextField 
                            label="Enter Symbol"
                            value={symbol}
                            onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                            onKeyPress={(e) => e.key === 'Enter' && handleQuote()}
                            error={!!error}
                            helperText={error}
                            disabled={loading}
                        />
                        <Button 
                            variant="contained" 
                            onClick={handleQuote}
                            sx={{ ml: 2 }}
                            disabled={loading || !symbol}
                        >
                            {loading ? <CircularProgress size={24} /> : 'Get Quote'}
                        </Button>
                        <Button 
                            variant="outlined" 
                            sx={{ ml: 1 }}
                            disabled={loading || !quoteData}
                        >
                            Add to Watchlist
                        </Button>
                    </Paper>
                </Grid>

                {/* Chart Section */}
                <Grid item xs={12}>
                    <Paper elevation={3} sx={{ p: 2, minHeight: '500px' }}>
                        {quoteData?.quote?.symbol && (
                            <TradingViewWidget symbol={quoteData.quote.symbol} />
                        )}
                        {loading && (
                            <Box display="flex" justifyContent="center" alignItems="center" height="500px">
                                <CircularProgress />
                            </Box>
                        )}
                    </Paper>
                </Grid>

                {/* Data Points Section */}
                <Grid item xs={12}>
                    <Paper elevation={3} sx={{ p: 2 }}>
                        {/* Yahoo Finance data points will go here */}
                    </Paper>
                </Grid>

                {/* Data Display Section */}
                <Grid item xs={12}>
                    <Paper elevation={3} sx={{ p: 2 }}>
                        {quoteData?.quote && (
                            <Grid container spacing={2}>
                                <Grid item xs={12}>
                                    <Typography variant="h4">
                                        {quoteData.quote.longName} ({quoteData.quote.symbol})
                                    </Typography>
                                    <Typography variant="h5" color="primary">
                                        ${quoteData.quote.regularMarketPrice?.toFixed(2)}
                                        <Typography component="span" color={quoteData.quote.regularMarketChange > 0 ? 'success.main' : 'error.main'}>
                                            {` ${quoteData.quote.regularMarketChange > 0 ? '+' : ''}${quoteData.quote.regularMarketChange?.toFixed(2)} (${quoteData.quote.regularMarketChangePercent?.toFixed(2)}%)`}
                                        </Typography>
                                    </Typography>
                                </Grid>
                                
                                {/* Add more data sections as needed */}
                            </Grid>
                        )}
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
};

export default QuotePage; 