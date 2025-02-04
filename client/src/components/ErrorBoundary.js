import React from 'react';
import { Paper, Typography, Button } from '@mui/material';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error('Error caught by boundary:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <Paper sx={{ p: 3, m: 2, bgcolor: 'error.dark', color: 'white' }}>
                    <Typography variant="h6">Something went wrong</Typography>
                    <Typography variant="body2" sx={{ mb: 2 }}>
                        {this.state.error?.message || 'Unknown error occurred'}
                    </Typography>
                    <Button 
                        variant="contained" 
                        onClick={() => window.location.reload()}
                        color="inherit"
                    >
                        Reload Page
                    </Button>
                </Paper>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary; 