import React from 'react';
import { Box, Paper } from '@mui/material';

const TestPage = () => {
    return (
        <Box p={3}>
            <Paper elevation={3} sx={{ p: 2 }}>
                <h2>Strategy Testing</h2>
                {/* Backtesting interface will go here */}
            </Paper>
        </Box>
    );
};

export default TestPage; 