const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const yahooFinance = require('yahoo-finance2');
const chalk = require('chalk');
const boxen = require('boxen');
const figlet = require('figlet');
const clear = require('clear');
const ngrok = require('ngrok');
const fetch = require('node-fetch');
const portfinder = require('portfinder');
const os = require('os');
const localtunnel = require('localtunnel');

mongoose.set('strictQuery', false);

const app = express();
const PORT = process.env.PORT || 2008;

// Status tracking
let serverStatus = {
    api: false,
    frontend: false,
    database: false,
    ngrok: false,
    lastUpdate: null,
    uptime: 0,
    ngrokUrl: null
};

// Add this near the top with other let declarations
let frontendPort = 3001;  // Default frontend port
let backendPort = 2008;   // Default backend port

// Clear terminal and show banner
const showBanner = () => {
    clear();
    // Add padding lines with [0] prefix
    console.log('[0]');
    console.log('[0]');
    console.log('[0]');
    console.log(chalk.green.bold('╔════════════════════════════════════════════════════════════════╗'));
    console.log(chalk.green.bold('║                        STOCKBOX TERMINAL                       ║'));
    console.log(chalk.green.bold('║                Professional Financial Suite v1.0.0             ║'));
    console.log(chalk.green.bold('╚════════════════════════════════════════════════════════════════╝\n'));
};

// Update status display
const updateDisplay = async (ngrokUrl) => {
    // Get IP for password display
    let ip = 'Fetching...';
    try {
        const ipResponse = await fetch('https://api.ipify.org?format=json');
        const data = await ipResponse.json();
        ip = data.ip;
    } catch {
        try {
            const ipResponse = await fetch('https://ifconfig.me/ip');
            ip = await ipResponse.text();
        } catch {
            ip = 'Could not determine IP';
        }
    }

    const uptimeMinutes = Math.floor(serverStatus.uptime / 60);
    const uptimeSeconds = serverStatus.uptime % 60;
    
    const serverInfo = boxen(
        `${chalk.bold.green('╔═══════════════ STOCKBOX TERMINAL ═══════════════╗')}\n\n` +
        
        `${chalk.yellow('▸ LOCAL SERVERS')}${chalk.dim('  (Internal Access)')}\n` +
        `  API Server    ${serverStatus.api ? chalk.green('● ONLINE ') : chalk.red('● OFFLINE')}  ${chalk.dim(`localhost:${PORT}`)}\n` +
        `  Frontend      ${serverStatus.frontend ? chalk.green('● ONLINE ') : chalk.red('● OFFLINE')}  ${chalk.dim('localhost:3001')}\n` +
        `  Database      ${serverStatus.database ? chalk.green('● ONLINE ') : chalk.red('● OFFLINE')}  ${chalk.dim('MongoDB')}\n\n` +
        
        `${chalk.yellow('▸ PUBLIC ACCESS')}${chalk.dim('  (External Access)')}\n` +
        `  NGROK Status  ${serverStatus.ngrok ? chalk.green('● ACTIVE ') : chalk.red('● INACTIVE')}\n` +
        `  Public URL    ${serverStatus.ngrok ? chalk.cyan(ngrokUrl) : chalk.dim('Not available')}\n` +
        `  Password      ${chalk.cyan(ip)}\n\n` +
        
        `${chalk.yellow('▸ SYSTEM METRICS')}\n` +
        `  Uptime        ${chalk.green(`${String(uptimeMinutes).padStart(2, '0')}:${String(uptimeSeconds).padStart(2, '0')}`)} ${chalk.dim('(MM:SS)')}\n` +
        `  Memory        ${chalk.green(Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + 'MB')} ${chalk.dim('used')}\n` +
        `  Last Update   ${chalk.dim(new Date().toLocaleTimeString())}\n` +
        `  Auto-Refresh  ${chalk.green('5s')} ${chalk.dim('interval')}\n\n` +
        
        `${chalk.yellow('▸ API ENDPOINTS')}\n` +
        `  ${chalk.green('GET')}  ${chalk.white('/api/quote/:symbol')}  ${chalk.dim('Stock quote lookup')}\n` +
        `  ${chalk.green('GET')}  ${chalk.white('/health')}            ${chalk.dim('Server health check')}\n\n` +
        
        `${chalk.dim('Press')} ${chalk.cyan('Ctrl+C')} ${chalk.dim('to shutdown servers')}`,
        {
            padding: 1,
            margin: {top: 1, bottom: 1, left: 0, right: 0},
            borderStyle: 'round',
            borderColor: 'green',
            float: 'left',
            title: chalk.green('LIVE'),
            titleAlignment: 'left'
        }
    );
    
    showBanner();
    console.log(serverInfo);
};

// Add this function for port management
const setupPorts = async () => {
    try {
        // Configure portfinder
        portfinder.basePort = backendPort;
        portfinder.highestPort = backendPort + 100;

        // Find available backend port
        const availableBackendPort = await portfinder.getPortPromise();
        backendPort = availableBackendPort;

        // Set frontend port
        frontendPort = 3001;  // We're forcing this in package.json

        return true;
    } catch (error) {
        console.error(chalk.red('Failed to setup ports:', error.message));
        return false;
    }
};

// Replace setupNgrok with setupTunnel
const setupTunnel = async () => {
    try {
        const tunnel = await localtunnel({ 
            port: 2008,
            subdomain: 'stockbox'
        });

        // Get public IP using multiple services in case one fails
        let ip;
        try {
            const ipResponse = await fetch('https://api.ipify.org?format=json');
            const data = await ipResponse.json();
            ip = data.ip;
        } catch {
            try {
                const ipResponse = await fetch('https://ifconfig.me/ip');
                ip = await ipResponse.text();
            } catch {
                ip = 'Could not determine IP';
            }
        }

        console.log(chalk.green('✓ Tunnel established at:', tunnel.url));
        console.log(chalk.cyan('╭─ Tunnel Access Info ────────────────────╮'));
        console.log(chalk.cyan('│  URL:      '), tunnel.url);
        console.log(chalk.cyan('│  Password: '), ip);
        console.log(chalk.cyan('╰──────────────────────────────────────────╯\n'));

        serverStatus.ngrok = true;
        serverStatus.ngrokUrl = tunnel.url;
        return tunnel.url;

    } catch (error) {
        console.error(chalk.red('Tunnel Error:', error.message));
        showError('Failed to establish public access tunnel');
        serverStatus.ngrok = false;
        serverStatus.ngrokUrl = null;
        return null;
    }
};

// Update the startServer function
const startServer = async () => {
    showBanner();
    
    try {
        // Setup ports first
        const portsSetup = await setupPorts();
        if (!portsSetup) {
            throw new Error('Failed to setup ports');
        }

        // MongoDB Connection
        await mongoose.connect('mongodb://localhost:27017/financial-terminal', {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        serverStatus.database = true;
        console.log(chalk.green('✓ MongoDB Connected'));

        // Update PORT constant to use dynamic backendPort
        const app = express();
        
        // Middleware
        app.use(cors());
        app.use(express.json());

        // Routes
        app.get('/api/quote/:symbol', async (req, res) => {
            try {
                const { symbol } = req.params;
                const [quote, stats, financials] = await Promise.all([
                    yahooFinance.quote(symbol),
                    yahooFinance.quoteSummary(symbol, { modules: ['defaultKeyStatistics', 'financialData'] }),
                    yahooFinance.quoteSummary(symbol, { modules: ['incomeStatementHistory', 'balanceSheetHistory'] })
                ]);

                res.json({
                    quote,
                    stats: stats.defaultKeyStatistics,
                    financials: {
                        financialData: stats.financialData,
                        incomeStatement: financials.incomeStatementHistory,
                        balanceSheet: financials.balanceSheetHistory
                    }
                });
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        // Health check endpoint
        app.get('/health', (req, res) => {
            res.json({ status: 'healthy' });
        });

        // Start server with dynamic port
        app.listen(backendPort, async () => {
            serverStatus.api = true;
            console.log(chalk.green(`✓ Server running on port ${backendPort}`));
            
            // Setup tunnel
            const tunnelUrl = await setupTunnel();
            
            // Start status monitoring
            setInterval(async () => {
                await checkFrontendStatus();
                serverStatus.uptime += 5;
                updateDisplay(tunnelUrl);
            }, 5000);
            
            // Initial display
            updateDisplay(tunnelUrl);
        });

    } catch (error) {
        console.error(chalk.red('Server failed to start:', error.message));
        process.exit(1);
    }
};

// Update the checkFrontendStatus function
const checkFrontendStatus = async () => {
    try {
        // Try multiple times as React can be slow to start
        const response = await fetch(`http://localhost:3001/manifest.json`);
        serverStatus.frontend = response.ok;
    } catch (error) {
        // Don't mark as offline immediately during startup
        if (serverStatus.uptime < 30) {
            serverStatus.frontend = true;
        } else {
            serverStatus.frontend = false;
        }
    }
};

// Handle graceful shutdown
process.on('SIGINT', async () => {
    console.log(chalk.yellow('\nShutting down gracefully...'));
    await ngrok.kill();
    process.exit(0);
});

const showError = (message) => {
    console.log(boxen(
        `${chalk.red.bold('ERROR')}\n\n${chalk.white(message)}`,
        {
            padding: 1,
            margin: {top: 1, bottom: 1, left: 0, right: 0},
            borderStyle: 'round',
            borderColor: 'red',
            float: 'left'
        }
    ));
};

startServer(); 