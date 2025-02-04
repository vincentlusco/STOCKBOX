import React from 'react';
import { Box, AppBar, Toolbar, Button, Typography } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';

const Layout = ({ children }) => {
    const navigate = useNavigate();
    const location = useLocation();

    const navItems = [
        { path: '/quote', label: 'QUOTE' },
        { path: '/watchlist', label: 'WATCHLIST' },
        { path: '/test', label: 'TEST' },
        { path: '/warren', label: 'WARREN' }
    ];

    return (
        <Box>
            <AppBar position="static" sx={{ backgroundColor: '#1a1a1a' }}>
                <Toolbar>
                    <Typography variant="h6" component="div" sx={{ flexGrow: 0, mr: 4 }}>
                        STOCKBOX
                    </Typography>
                    {navItems.map((item) => (
                        <Button
                            key={item.path}
                            color="inherit"
                            onClick={() => navigate(item.path)}
                            sx={{
                                mx: 1,
                                fontWeight: location.pathname === item.path ? 'bold' : 'normal',
                                borderBottom: location.pathname === item.path ? '2px solid white' : 'none'
                            }}
                        >
                            {item.label}
                        </Button>
                    ))}
                </Toolbar>
            </AppBar>
            <Box component="main">
                {children}
            </Box>
        </Box>
    );
};

export default Layout; 