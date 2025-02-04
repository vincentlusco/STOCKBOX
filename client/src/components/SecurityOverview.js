import React from 'react';
import { Paper, Grid, Typography, Box, Chip } from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';

const formatPercent = (value) => {
    if (!value) return 'N/A';
    return `${(value * 100).toFixed(2)}%`;
};

const formatCurrency = (value) => {
    if (!value) return 'N/A';
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2
    }).format(value);
};

const SecurityOverview = ({ data }) => {
    const quote = data.quote || {};
    const change = quote.regularMarketChange || 0;
    const changePercent = quote.regularMarketChangePercent || 0;
    const isPositive = change >= 0;

    return (
        <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
            <Grid container spacing={3}>
                {/* Header */}
                <Grid item xs={12}>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Box>
                            <Typography variant="h4">{quote.shortName}</Typography>
                            <Box display="flex" alignItems="center" gap={1}>
                                <Typography variant="h6" color="textSecondary">
                                    {quote.symbol}
                                </Typography>
                                <Chip 
                                    label={data.securityType} 
                                    size="small" 
                                    color="primary"
                                />
                            </Box>
                        </Box>
                        <Box textAlign="right">
                            <Typography variant="h4">
                                {formatCurrency(quote.regularMarketPrice)}
                            </Typography>
                            <Box display="flex" alignItems="center" justifyContent="flex-end" gap={1}>
                                {isPositive ? 
                                    <TrendingUpIcon color="success" /> : 
                                    <TrendingDownIcon color="error" />
                                }
                                <Typography 
                                    variant="h6" 
                                    color={isPositive ? 'success.main' : 'error.main'}
                                >
                                    {formatCurrency(change)} ({formatPercent(changePercent)})
                                </Typography>
                            </Box>
                        </Box>
                    </Box>
                </Grid>

                {/* Key Stats */}
                <Grid item xs={12}>
                    <Grid container spacing={2}>
                        <Grid item xs={6} sm={3}>
                            <Typography color="textSecondary">Open</Typography>
                            <Typography variant="h6">
                                {formatCurrency(quote.regularMarketOpen)}
                            </Typography>
                        </Grid>
                        <Grid item xs={6} sm={3}>
                            <Typography color="textSecondary">Previous Close</Typography>
                            <Typography variant="h6">
                                {formatCurrency(quote.regularMarketPreviousClose)}
                            </Typography>
                        </Grid>
                        <Grid item xs={6} sm={3}>
                            <Typography color="textSecondary">Volume</Typography>
                            <Typography variant="h6">
                                {quote.regularMarketVolume?.toLocaleString()}
                            </Typography>
                        </Grid>
                        <Grid item xs={6} sm={3}>
                            <Typography color="textSecondary">Market Cap</Typography>
                            <Typography variant="h6">
                                {quote.marketCap?.toLocaleString()}
                            </Typography>
                        </Grid>
                    </Grid>
                </Grid>
            </Grid>
        </Paper>
    );
};

export default SecurityOverview; 