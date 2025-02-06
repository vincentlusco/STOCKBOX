const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const yahooFinance = require('yahoo-finance2').default;
const chalk = require('chalk');
const boxen = require('boxen');
const figlet = require('figlet');
const clear = require('clear');
const ngrok = require('ngrok');
const fetch = require('node-fetch');
const portfinder = require('portfinder');
const os = require('os');
const WebSocket = require('ws');
const TechnicalAnalysis = require('./technicalAnalysis');
const DataAggregator = require('./dataAggregator');
const testRoutes = require('./routes/test');

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

// Configure Yahoo Finance with options
const yfOptions = {
    queue: {
        concurrent: 1,     // Run one request at a time
        interval: 1000,    // Wait 1 second between requests
        timeout: 10000     // Timeout after 10 seconds
    }
};

const yf = yahooFinance;

// Simple console logger for now
const logger = {
    info: (...args) => console.log(chalk.blue('[INFO]'), ...args),
    error: (...args) => console.error(chalk.red('[ERROR]'), ...args),
    warn: (...args) => console.warn(chalk.yellow('[WARN]'), ...args)
};

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
        `  Auto-Refresh  ${chalk.green('15s')} ${chalk.dim('interval')}\n\n` +
        
        `${chalk.yellow('▸ API ENDPOINTS')}\n` +
        `  ${chalk.green('GET')}  ${chalk.white('/api/quote/:symbol')}  ${chalk.dim('Stock quote lookup')}\n` +
        `  ${chalk.green('GET')}  ${chalk.white('/health')}            ${chalk.dim('Server health check')}\n` +
        `  ${chalk.green('GET')}  ${chalk.white('/api/test/security-type/:symbol')}  ${chalk.dim('Security type detection')}\n` +
        `  ${chalk.green('GET')}  ${chalk.white('/api/test/technical/:symbol')}  ${chalk.dim('Technical analysis')}\n` +
        `  ${chalk.green('GET')}  ${chalk.white('/api/test/aggregate/:symbol')}  ${chalk.dim('Data aggregation')}\n` +
        `  ${chalk.green('GET')}  ${chalk.white('/api/test/websocket/:symbol')}  ${chalk.dim('WebSocket connection')}\n\n` +
        
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

// Update the setupTunnel function
const setupTunnel = async () => {
    try {
        // Configure ngrok with auth token
        await ngrok.authtoken('2sKgUdRwTCfO39AMurxgP9YLbKk_3DVisq4ESw5y7T7jLVBAm');

        const url = await ngrok.connect({
            addr: backendPort,
            region: 'us',
            proto: 'http',
            addr_version: 'ipv4',
            bind_tls: true
        });

        console.log(chalk.green('✓ Tunnel established at:', url));
        serverStatus.ngrok = true;
        serverStatus.ngrokUrl = url;
        return url;

    } catch (error) {
        // Log error details safely
        console.error(chalk.red('Tunnel Error Details:'));
        console.error(chalk.red('Message:', error.message));
        console.error(chalk.red('Code:', error.code));
        console.error(chalk.red('Stack:', error.stack));
        
        console.error(chalk.red('Tunnel Error:', error.message));
        console.log(chalk.yellow('Falling back to local development mode'));
        serverStatus.ngrok = false;
        serverStatus.ngrokUrl = `http://localhost:${backendPort}`;
        return serverStatus.ngrokUrl;
    }
};

// Update the server startup
const startServer = async () => {
    showBanner();
    
    try {
        // Middleware
        app.use(cors({
            origin: ['http://localhost:3001', /\.ngrok\.io$/, /\.ngrok-free\.app$/],
            credentials: true
        }));
        app.use(express.json());

        // Setup ports first
        const portsSetup = await setupPorts();
        if (!portsSetup) {
            throw new Error('Failed to setup ports');
        }

        // MongoDB Connection
        try {
            await mongoose.connect('mongodb://localhost:27017/financial-terminal', {
                useNewUrlParser: true,
                useUnifiedTopology: true,
            });
            serverStatus.database = true;
            console.log(chalk.green('✓ MongoDB Connected'));
        } catch (dbError) {
            console.warn(chalk.yellow('Warning: MongoDB connection failed, continuing without database'));
            serverStatus.database = false;
        }

        // Add this after the middleware setup and before starting the server
        // In the startServer function, after app.use(express.json());

        // Routes
        app.get('/api/quote/:symbol', async (req, res) => {
            try {
                const { symbol } = req.params;
                console.log('Fetching data for symbol:', symbol);

                // Enhanced symbol detection and formatting
                const securityType = detectSecurityType(symbol);
                
                // Enhanced module selection based on security type
                const modules = getModulesForSecurity(securityType);

                // Fetch quote data with retries
                let quote;
                try {
                    quote = await yf.quote(symbol, yfOptions);
                    if (!quote) throw new Error('No quote data returned');
                    console.log('Quote type:', quote.quoteType);
                    console.log('Basic quote data:', {
                        symbol: quote.symbol,
                        shortName: quote.shortName,
                        quoteType: quote.quoteType,
                        price: quote.regularMarketPrice
                    });
                } catch (quoteError) {
                    console.error('Quote fetch error:', quoteError);
                    return res.status(404).json({
                        error: 'Symbol not found or invalid',
                        details: quoteError.message
                    });
                }

                // Fetch additional data
                let details = {};
                try {
                    details = await yf.quoteSummary(symbol, { modules, ...yfOptions });
                    console.log('\n=== YAHOO FINANCE DATA FOR:', symbol, '===');
                    console.log('\nQUOTE DATA:');
                    console.log(JSON.stringify(quote, null, 2));
                    console.log('\nDETAILED DATA:');
                    Object.keys(details).forEach(key => {
                        console.log(`\n${key.toUpperCase()}:`);
                        console.log(JSON.stringify(details[key], null, 2));
                    });
                    console.log('\n=== END OF DATA ===\n');
                } catch (detailsError) {
                    console.warn('Details fetch warning:', detailsError);
                }

                const response = {
                    quote,
                    rawData: details
                };

                console.log('\nSending response with sections:', Object.keys(response));
                console.log('Available data modules:', Object.keys(details));
                return res.json(response);

            } catch (error) {
                console.error('Server Error:', error);
                return res.status(500).json({ 
                    error: 'Internal server error',
                    message: error.message,
                    stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
                });
            }
        });

        // Health check endpoint
        app.get('/health', (req, res) => {
            res.json({ status: 'healthy' });
        });

        // Test security type detection
        app.get('/api/test/security-type/:symbol', (req, res) => {
            try {
                const { symbol } = req.params;
                const type = detectSecurityType(symbol);
                const modules = getModulesForSecurity(type);
                
                res.json({
                    symbol,
                    detectedType: type,
                    availableModules: modules
                });
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        // Test technical analysis
        app.get('/api/test/technical/:symbol', async (req, res) => {
            try {
                const { symbol } = req.params;
                const historicalData = await yf.historical(symbol, {
                    period1: '2024-01-01',
                    period2: '2024-02-04'
                });
                
                const analysis = new TechnicalAnalysis();
                const indicators = await analysis.calculateIndicators(
                    historicalData.map(d => d.close),
                    historicalData.map(d => d.volume)
                );
                
                res.json({
                    symbol,
                    indicators,
                    dataPoints: historicalData.length
                });
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        // Test data aggregation
        app.get('/api/test/aggregate/:symbol', async (req, res) => {
            try {
                const { symbol } = req.params;
                const type = detectSecurityType(symbol);
                const aggregator = new DataAggregator(setupDataProviders());
                
                const data = await aggregator.getCompleteData(symbol, type);
                
                res.json({
                    symbol,
                    type,
                    data,
                    dataSources: Object.keys(data),
                    cacheStatus: aggregator.cache.has(`${symbol}_${type}`)
                });
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        // Test WebSocket connection
        app.get('/api/test/websocket/:symbol', (req, res) => {
            try {
                const { symbol } = req.params;
                const ws = new WebSocket('ws://localhost:8080');
                
                ws.on('open', () => {
                    ws.send(JSON.stringify({
                        type: 'subscribe',
                        symbols: [symbol]
                    }));
                });
                
                // Send initial response
                res.json({
                    status: 'WebSocket test initiated',
                    symbol,
                    wsPort: 8080
                });
                
                // Log messages for 30 seconds
                let count = 0;
                ws.on('message', (data) => {
                    console.log(`WS Data [${++count}]:`, JSON.parse(data));
                    if (count >= 10) ws.close();
                });
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        // Initialize systems
        try {
            const providers = setupDataProviders();
            const dataAggregator = new DataAggregator(providers);
            const realtime = setupRealtimeSystem();
            console.log(chalk.green('✓ Systems initialized'));
        } catch (error) {
            console.error(chalk.red('System initialization error:', error.message));
        }

        // Start server
        const server = app.listen(backendPort, async () => {
            serverStatus.api = true;
            console.log(chalk.green(`✓ Server running on port ${backendPort}`));
            
            // Setup tunnel
            const tunnelUrl = await setupTunnel();
            
            // Start status monitoring
            setInterval(async () => {
                await checkFrontendStatus();
                serverStatus.uptime += 15;
                updateDisplay(tunnelUrl);
            }, 15000);
            
            // Initial display
            updateDisplay(tunnelUrl);
        });

        // Handle server errors
        server.on('error', (error) => {
            console.error(chalk.red('Server Error:', error.message));
            if (error.code === 'EADDRINUSE') {
                console.log(chalk.yellow(`Port ${backendPort} is in use, trying another port...`));
                server.close();
                startServer();
            }
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

// Enhanced symbol detection and formatting
const detectSecurityType = (symbol) => {
    // Warrants detection (matches AAPL+W, MSFT+W)
    if (symbol.endsWith('+W')) {
        return 'WARRANT';
    }

    // Units detection (matches SPAC.U, PSTH-U)
    if (symbol.endsWith('.U') || symbol.endsWith('-U')) {
        return 'UNIT';
    }

    // Rights detection (matches SPAC.RT, PSTH-R)
    if (symbol.endsWith('.RT') || symbol.endsWith('-R')) {
        return 'RIGHT';
    }

    // Index patterns
    const commonIndices = ['VIX', '^GSPC', '^DJI', '^IXIC'];
    if (commonIndices.includes(symbol) || symbol.startsWith('^')) {
        return 'INDEX';
    }

    // Crypto patterns - enhance detection
    // Common crypto symbols
    const cryptoSymbols = ['BTC', 'ETH', 'XRP', 'DOGE', 'USDT', 'BNB', 'ADA', 'SOL'];
    
    // Check if it's a crypto pair
    const parts = symbol.split('-');
    if (parts.length === 2) {
        const [base, quote] = parts;
        // If either part is a known crypto or it's a USD pair
        if (cryptoSymbols.includes(base) || cryptoSymbols.includes(quote) || quote === 'USD') {
            return 'CRYPTO';
        }
    }

    // Check alternative crypto format
    const cryptoAltPattern = /^CRYPTO:([A-Z0-9]{3,10})$/;  // Matches CRYPTO:BTC format
    if (cryptoAltPattern.test(symbol)) {
        return 'CRYPTO';
    }

    // Forex patterns - enhance detection
    const forexPattern = /^[A-Z]{3}[A-Z]{3}=X$/;  // Matches EURUSD=X format
    const forexAltPattern = /^[A-Z]{3}\/[A-Z]{3}$/;  // Matches EUR/USD format
    if (forexPattern.test(symbol) || forexAltPattern.test(symbol) || symbol.endsWith('=X')) {
        return 'FOREX';
    }
    // Options pattern
    const optionsPattern = /^([A-Z]+)(\d{6}|\-\d{4}\-\d{2}\-\d{2}\-)(C|P)\d+$/;
    const simpleOptionsPattern = /^([A-Z]+)\-([CP])\-\d+$/;  // AAPL-C-180
    if (optionsPattern.test(symbol) || simpleOptionsPattern.test(symbol)) {
        return 'OPTION';
    }
    // ETF list check (we could maintain a list or check characteristics)
    const commonETFs = ['SPY', 'QQQ', 'IWM', 'VTI'];
    if (commonETFs.includes(symbol)) {
        return 'ETF';
    }
    // Handle exchange-specific symbols
    if (symbol.includes(':')) {
        const [exchange, ticker] = symbol.split(':');
        // Known international exchanges
        const exchanges = {
            'TSE': 'STOCK',  // Tokyo
            'LSE': 'STOCK',  // London
            'SSE': 'STOCK',  // Shanghai
            'HKEX': 'STOCK'  // Hong Kong
        };
        return exchanges[exchange] || 'STOCK';
    }

    // Futures detection
    if (symbol.endsWith('=F')) {
        return 'FUTURE';
    }

    // Complex ETF detection
    const leveragedETFs = ['TQQQ', 'SQQQ', 'UVXY', 'SVXY', 'SPXL', 'SPXS'];
    if (leveragedETFs.includes(symbol)) {
        return 'LEVERAGED_ETF';
    }

    // ADR detection (American Depositary Receipts)
    const adrSymbols = ['BABA', 'JD', 'NIO', 'TCEHY', 'BIDU'];
    if (adrSymbols.includes(symbol)) {
        return 'ADR';
    }

    // REITs detection
    const reitSymbols = ['SPG', 'PLD', 'AMT', 'CCI', 'EQIX'];
    if (reitSymbols.includes(symbol)) {
        return 'REIT';
    }

    // Preferred Stock detection
    // Match patterns like BAC-PL, JPM-PRC, WFC-PRZ
    const preferredPattern = /^[A-Z]+\-P[A-Z]?[A-Z]?$/;
    if (preferredPattern.test(symbol) || symbol.includes('PFD')) {
        return 'PREFERRED';
    }

    // Convertible bonds
    if (symbol.endsWith('-CB') || symbol.endsWith('-CV')) {
        return 'CONVERTIBLE';
    }

    // Structured products
    if (symbol.endsWith('.P') || symbol.endsWith('.IV')) {
        return 'STRUCTURED';
    }

    // Depositary receipts (ADR/ADS)
    if (symbol.endsWith('-ADR') || symbol.endsWith('-ADS')) {
        return 'DR';
    }

    // Mutual Fund detection
    const mutualFundPattern = /^[A-Z]{4,5}X$/;  // Most mutual funds end in X
    if (mutualFundPattern.test(symbol)) {
        return 'MUTUAL_FUND';
    }

    // Money Market detection
    const moneyMarketSymbols = ['BIL', 'SHV', 'MINT', 'GBIL'];
    if (moneyMarketSymbols.includes(symbol)) {
        return 'MONEY_MARKET';
    }

    // Hybrid Securities
    if (symbol.includes('.P') && !symbol.endsWith('.P')) {
        return 'HYBRID';
    }

    // Municipal Bond detection
    const muniBondSymbols = ['MUB', 'TFI', 'CMF', 'NYF', 'PZA'];
    if (muniBondSymbols.includes(symbol)) {
        return 'MUNI_BOND';
    }

    // Commercial Paper detection
    if (symbol.includes('CP-') || symbol.endsWith('CP')) {
        return 'COMMERCIAL_PAPER';
    }

    // Asset-Backed Securities detection
    if (symbol.includes('-ABS-')) {
        return 'ABS';
    }

    // Default to stock
    return 'STOCK';
};

// Enhanced module selection based on security type
const getModulesForSecurity = (securityType) => {
    const baseModules = [
        'price',
        'summaryDetail',
        'defaultKeyStatistics'
    ];

    switch (securityType) {
        case 'LEVERAGED_ETF':
            return [
                ...baseModules,
                'fundProfile',
                'topHoldings',
                'fundPerformance',
                'riskMetrics',
                'leverageInfo',
                'tradingData'
            ];
        case 'FUTURE':
            return [
                ...baseModules,
                'futuresChain',
                'contractSpecs',
                'tradingHours',
                'marginRequirements',
                'technicalInsights'
            ];
        case 'INDEX':
            return [
                ...baseModules,
                'components',
                'marketSummary',
                'indexTrend',
                'historicalData'
            ];
        case 'STOCK':
            return [
                ...baseModules,
                'financialData',
                'incomeStatementHistory',
                'balanceSheetHistory',
                'cashflowStatementHistory',
                'earningsHistory',
                'recommendationTrend',
                'upgradeDowngradeHistory',
                'institutionOwnership',
                'insiderHolders',
                'secFilings',
                'indexTrend',
                'sectorTrend',
                'earningsTrend',
                'netSharePurchaseActivity',
                'majorHoldersBreakdown'
            ];

        case 'ETF':
            return [
                ...baseModules,
                'fundProfile',
                'topHoldings',
                'fundPerformance',
                'fundOwnership',
                'assetProfile',
                'indexTrend',
                'sectorTrend'
            ];

        case 'CRYPTO':
            return [
                ...baseModules,
                'technicalInsights',
                'tradingData',
                'blockchainData'  // Custom module we might need to add
            ];

        case 'FOREX':
            return [
                ...baseModules,
                'technicalInsights',
                'economicData'  // Custom module for economic indicators
            ];

        case 'OPTION':
            return [
                ...baseModules,
                'optionChain',
                'optionAnalysis',
                'volatilityData'
            ];

        case 'ADR':
            return [
                ...baseModules,
                'financialData',
                'earningsHistory',
                'recommendationTrend',
                'foreignData',  // International market data
                'homeMarketData',  // Original exchange data
                'currencyExposure'
            ];

        case 'REIT':
            return [
                ...baseModules,
                'realEstateData',  // Property portfolio
                'occupancyRates',
                'ffoCoverage',  // Funds from Operations
                'dividendData',
                'propertyMetrics'
            ];

        case 'PREFERRED':
            return [
                ...baseModules,
                'preferredData',  // Preferred-specific info
                'dividendHistory',
                'callSchedule',
                'ratingData',
                'yieldMetrics'
            ];

        case 'WARRANT':
            return [
                ...baseModules,
                'warrantData',
                'exercisePrice',
                'expirationDate',
                'underlyingAsset',
                'conversionRatio'
            ];

        case 'UNIT':
            return [
                ...baseModules,
                'unitComposition',  // Common shares + warrants
                'splitConditions',
                'redemptionTerms',
                'trustDetails',
                'spacData'
            ];

        case 'RIGHT':
            return [
                ...baseModules,
                'rightTerms',
                'exerciseDetails',
                'expirationDate',
                'conversionRatio',
                'underlyingAsset'
            ];

        case 'CONVERTIBLE':
            return [
                ...baseModules,
                'conversionTerms',
                'yieldToMaturity',
                'creditRating',
                'underlyingEquity',
                'conversionPrice'
            ];

        case 'STRUCTURED':
            return [
                ...baseModules,
                'productTerms',
                'underlyingAssets',
                'payoffStructure',
                'barrierLevels',
                'participationRate'
            ];

        case 'DR':
            return [
                ...baseModules,
                'homeMarket',
                'conversionRatio',
                'sponsoringBank',
                'depositaryFees',
                'foreignListing'
            ];

        case 'MUTUAL_FUND':
            return [
                ...baseModules,
                'fundProfile',
                'performanceOverview',
                'riskMeasures',
                'assetAllocation',
                'holdings',
                'fees'
            ];

        case 'MONEY_MARKET':
            return [
                ...baseModules,
                'yieldHistory',
                'weightedAverageMaturity',
                'portfolioComposition',
                'creditQuality',
                'expenseRatio'
            ];

        case 'HYBRID':
            return [
                ...baseModules,
                'hybridTerms',
                'conversionFeatures',
                'callProtection',
                'dividendSchedule',
                'ratingHistory'
            ];

        case 'MUNI_BOND':
            return [
                ...baseModules,
                'municipalBondData',
                'yield',
                'maturityDate',
                'issuer',
                'rating',
                'bondRating',
                'taxStatus',
                'interestPayments',
                'maturitySchedule',
                'issuerInfo'
            ];

        case 'COMMERCIAL_PAPER':
            return [
                ...baseModules,
                'maturityDate',
                'discountRate',
                'dealerInfo',
                'issuerRating',
                'yieldToMaturity'
            ];

        case 'ABS':
            return [
                ...baseModules,
                'underlyingAssets',
                'trancheInfo',
                'prepaymentRisk',
                'creditEnhancement',
                'servicerDetails'
            ];

        default:
            return baseModules;
    }
};

const setupDataProviders = () => {
    // Initialize Finnhub client
    const finnhubClient = require('finnhub').ApiClient.instance;
    const api_key = finnhubClient.authentications['api_key'];
    api_key.apiKey = process.env.FINNHUB_API_KEY || 'sandbox_c1qfhsaad3ifj5h2ot70';
    const finnhubApi = new (require('finnhub').DefaultApi)();

    return {
        primary: yahooFinance,
        secondary: {
            finnhub: finnhubApi,
            secApi: require('sec-api'),
            newsapi: new (require('newsapi'))(process.env.NEWS_API_KEY || 'test')
        }
    };
};

const setupRealtimeSystem = () => {
    try {
        const wss = new WebSocket.Server({ port: 8080 });
        const clients = new Map(); // Track client subscriptions

        wss.on('error', (error) => {
            console.error(chalk.red('WebSocket Server Error:', error.message));
        });

        const handleUnsubscription = (ws, symbols) => {
            const client = clients.get(ws);
            if (client) {
                client.connections.forEach(conn => conn.close());
                clients.delete(ws);
            }
        };

        // Clean up on client disconnect
        wss.on('close', () => {
            handleUnsubscription(ws);
        });

        wss.on('connection', (ws) => {
            ws.on('message', (message) => {
                const data = JSON.parse(message);
                switch (data.type) {
                    case 'subscribe':
                        handleSubscription(ws, data.symbols);
                        break;
                    case 'unsubscribe':
                        handleUnsubscription(ws, data.symbols);
                        break;
                }
            });
        });

        const handleSubscription = async (ws, symbols) => {
            // Setup Yahoo Finance WebSocket
            const yahooWS = new WebSocket('wss://streamer.finance.yahoo.com');
            
            // Setup Finnhub WebSocket for additional data
            const finnhubWS = new WebSocket('wss://ws.finnhub.io');

            // Track subscriptions
            clients.set(ws, { symbols, connections: [yahooWS, finnhubWS] });

            // Handle real-time data
            yahooWS.on('message', (data) => {
                const parsed = JSON.parse(data);
                ws.send(JSON.stringify({
                    type: 'price_update',
                    data: parsed
                }));
            });

            finnhubWS.on('message', (data) => {
                const parsed = JSON.parse(data);
                ws.send(JSON.stringify({
                    type: 'trade_update',
                    data: parsed
                }));
            });
        };

        return wss;
    } catch (error) {
        console.error(chalk.red('Failed to setup WebSocket server:', error.message));
        return null;
    }
};

startServer();

// Log all requests
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// Mount routes
app.use('/api', testRoutes);

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something broke!' });
});

module.exports = app; 