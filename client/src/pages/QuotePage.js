import React, { useState } from 'react';
import { Box, TextField, Button, Grid, Paper, Typography, CircularProgress,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Accordion, AccordionSummary, AccordionDetails, Link, Alert
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import TradingViewWidget from '../components/TradingViewWidget';
import ErrorBoundary from '../components/ErrorBoundary';
import SecurityOverview from '../components/SecurityOverview';

// Helper function to determine security type
const getSecurityType = (data) => {
    if (!data?.quote?.quoteType) return 'UNKNOWN';
    return data.quote.quoteType.toUpperCase();
};

// Helper function to format values with type checking
const formatValue = (value) => {
    try {
        if (value === null || value === undefined) return 'N/A';
        if (typeof value === 'number') {
            if (isNaN(value)) return 'N/A';
            if (value > 1000000000) return `$${(value / 1000000000).toFixed(2)}B`;
            if (value > 1000000) return `$${(value / 1000000).toFixed(2)}M`;
            if (value > 1000) return `$${(value / 1000).toFixed(2)}K`;
            return value.toLocaleString();
        }
        if (typeof value === 'boolean') return value ? 'Yes' : 'No';
        return value;
    } catch (error) {
        console.error('Format error:', error);
        return 'Error';
    }
};

const ErrorMessage = ({ error }) => (
    <Paper elevation={3} sx={{ p: 2, bgcolor: 'error.dark', color: 'white' }}>
        <Typography variant="h6">Error</Typography>
        <Typography>{error}</Typography>
    </Paper>
);

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
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'Failed to fetch quote data');
            }
            
            console.log('Received data:', data);
            setQuoteData(data);
        } catch (error) {
            console.error('Error fetching quote:', error);
            setError(error.message);
            setQuoteData(null);
        } finally {
            setLoading(false);
        }
    };

    // Render security type indicator
    const SecurityTypeIndicator = () => (
        <Alert severity="info" sx={{ mb: 2 }}>
            Security Type: {getSecurityType(quoteData)}
        </Alert>
    );

    return (
        <ErrorBoundary>
            <Box p={3}>
                <Grid container spacing={3}>
                    {/* Search Section */}
                    <Grid item xs={12}>
                        <Paper elevation={3} sx={{ p: 2 }}>
                            <TextField 
                                label="Enter Symbol (Stocks, ETFs, Crypto, etc.)"
                                value={symbol}
                                onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                                onKeyPress={(e) => e.key === 'Enter' && handleQuote()}
                                error={!!error}
                                helperText={error}
                                disabled={loading}
                                fullWidth
                                sx={{ mb: 2 }}
                            />
                            <Button 
                                variant="contained" 
                                onClick={handleQuote}
                                disabled={loading || !symbol}
                            >
                                {loading ? <CircularProgress size={24} /> : 'Get Quote'}
                            </Button>
                        </Paper>
                    </Grid>

                    {quoteData && (
                        <>
                            <Grid item xs={12}>
                                <SecurityTypeIndicator />
                            </Grid>
                            
                            <Grid item xs={12}>
                                <SecurityOverview data={quoteData} />
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

                            {/* Detailed Data Display */}
                            <Grid item xs={12}>
                                <Paper elevation={3} sx={{ p: 2 }}>
                                    {/* Market Data */}
                                    <Accordion defaultExpanded>
                                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                            <Typography variant="h6">Market Data</Typography>
                                        </AccordionSummary>
                                        <AccordionDetails>
                                            <TableContainer>
                                                <Table size="small">
                                                    <TableBody>
                                                        <TableRow>
                                                            <TableCell component="th">Market Cap</TableCell>
                                                            <TableCell>{formatValue(quoteData.quote.marketCap)}</TableCell>
                                                            <TableCell component="th">Volume</TableCell>
                                                            <TableCell>{formatValue(quoteData.quote.regularMarketVolume)}</TableCell>
                                                        </TableRow>
                                                        <TableRow>
                                                            <TableCell component="th">52 Week High</TableCell>
                                                            <TableCell>{formatValue(quoteData.quote.fiftyTwoWeekHigh)}</TableCell>
                                                            <TableCell component="th">52 Week Low</TableCell>
                                                            <TableCell>{formatValue(quoteData.quote.fiftyTwoWeekLow)}</TableCell>
                                                        </TableRow>
                                                    </TableBody>
                                                </Table>
                                            </TableContainer>
                                        </AccordionDetails>
                                    </Accordion>

                                    {/* Financial Data */}
                                    <Accordion>
                                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                            <Typography variant="h6">Financial Data</Typography>
                                        </AccordionSummary>
                                        <AccordionDetails>
                                            <TableContainer>
                                                <Table size="small">
                                                    <TableBody>
                                                        <TableRow>
                                                            <TableCell component="th">P/E Ratio</TableCell>
                                                            <TableCell>{formatValue(quoteData.stats?.forwardPE)}</TableCell>
                                                            <TableCell component="th">EPS</TableCell>
                                                            <TableCell>{formatValue(quoteData.stats?.forwardEps)}</TableCell>
                                                        </TableRow>
                                                        <TableRow>
                                                            <TableCell component="th">Dividend Yield</TableCell>
                                                            <TableCell>{formatValue(quoteData.stats?.dividendYield)}</TableCell>
                                                            <TableCell component="th">Dividend Rate</TableCell>
                                                            <TableCell>{formatValue(quoteData.stats?.dividendRate)}</TableCell>
                                                        </TableRow>
                                                    </TableBody>
                                                </Table>
                                            </TableContainer>
                                        </AccordionDetails>
                                    </Accordion>

                                    {/* Balance Sheet Data */}
                                    <Accordion>
                                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                            <Typography variant="h6">Balance Sheet</Typography>
                                        </AccordionSummary>
                                        <AccordionDetails>
                                            <TableContainer>
                                                <Table size="small">
                                                    <TableBody>
                                                        <TableRow>
                                                            <TableCell component="th">Total Assets</TableCell>
                                                            <TableCell>{formatValue(quoteData.financials?.balanceSheet?.totalAssets)}</TableCell>
                                                            <TableCell component="th">Total Debt</TableCell>
                                                            <TableCell>{formatValue(quoteData.financials?.balanceSheet?.totalDebt)}</TableCell>
                                                        </TableRow>
                                                    </TableBody>
                                                </Table>
                                            </TableContainer>
                                        </AccordionDetails>
                                    </Accordion>

                                    {/* Income Statement Data */}
                                    <Accordion>
                                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                            <Typography variant="h6">Income Statement</Typography>
                                        </AccordionSummary>
                                        <AccordionDetails>
                                            <TableContainer>
                                                <Table size="small">
                                                    <TableBody>
                                                        <TableRow>
                                                            <TableCell component="th">Revenue</TableCell>
                                                            <TableCell>{formatValue(quoteData.financials?.incomeStatement?.totalRevenue)}</TableCell>
                                                            <TableCell component="th">Net Income</TableCell>
                                                            <TableCell>{formatValue(quoteData.financials?.incomeStatement?.netIncome)}</TableCell>
                                                        </TableRow>
                                                    </TableBody>
                                                </Table>
                                            </TableContainer>
                                        </AccordionDetails>
                                    </Accordion>

                                    {/* Company Profile */}
                                    <Accordion>
                                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                            <Typography variant="h6">Company Profile</Typography>
                                        </AccordionSummary>
                                        <AccordionDetails>
                                            <TableContainer>
                                                <Table size="small">
                                                    <TableBody>
                                                        <TableRow>
                                                            <TableCell component="th">Industry</TableCell>
                                                            <TableCell>{formatValue(quoteData.profile?.industry)}</TableCell>
                                                            <TableCell component="th">Sector</TableCell>
                                                            <TableCell>{formatValue(quoteData.profile?.sector)}</TableCell>
                                                        </TableRow>
                                                        <TableRow>
                                                            <TableCell component="th">Employees</TableCell>
                                                            <TableCell>{formatValue(quoteData.profile?.fullTimeEmployees)}</TableCell>
                                                            <TableCell component="th">Country</TableCell>
                                                            <TableCell>{formatValue(quoteData.profile?.country)}</TableCell>
                                                        </TableRow>
                                                        <TableRow>
                                                            <TableCell component="th">Website</TableCell>
                                                            <TableCell colSpan={3}>
                                                                <Link href={quoteData.profile?.website} target="_blank">
                                                                    {quoteData.profile?.website}
                                                                </Link>
                                                            </TableCell>
                                                        </TableRow>
                                                    </TableBody>
                                                </Table>
                                            </TableContainer>
                                        </AccordionDetails>
                                    </Accordion>

                                    {/* Earnings & Growth */}
                                    <Accordion>
                                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                            <Typography variant="h6">Earnings & Growth</Typography>
                                        </AccordionSummary>
                                        <AccordionDetails>
                                            <TableContainer>
                                                <Table size="small">
                                                    <TableBody>
                                                        <TableRow>
                                                            <TableCell component="th">Revenue Growth</TableCell>
                                                            <TableCell>{formatValue(quoteData.stats?.revenueGrowth)}</TableCell>
                                                            <TableCell component="th">Earnings Growth</TableCell>
                                                            <TableCell>{formatValue(quoteData.stats?.earningsGrowth)}</TableCell>
                                                        </TableRow>
                                                        <TableRow>
                                                            <TableCell component="th">Profit Margins</TableCell>
                                                            <TableCell>{formatValue(quoteData.stats?.profitMargins)}</TableCell>
                                                            <TableCell component="th">Operating Margins</TableCell>
                                                            <TableCell>{formatValue(quoteData.stats?.operatingMargins)}</TableCell>
                                                        </TableRow>
                                                    </TableBody>
                                                </Table>
                                            </TableContainer>
                                        </AccordionDetails>
                                    </Accordion>
                                </Paper>
                            </Grid>
                        </>
                    )}

                    {error && (
                        <Grid item xs={12}>
                            <ErrorMessage error={error} />
                        </Grid>
                    )}
                </Grid>
            </Box>
        </ErrorBoundary>
    );
};

export default QuotePage; 