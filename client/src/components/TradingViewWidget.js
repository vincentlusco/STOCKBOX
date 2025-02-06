import React, { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';

const TradingViewWidget = ({ symbol, securityType }) => {
    const container = useRef();
    const scriptLoaded = useRef(false);

    const getFormattedSymbol = (symbol, type) => {
        // Default exchange mappings
        const exchangeMap = {
            'FUTURES': {
                'ES': 'CME_MINI:ES1!',  // E-mini S&P 500
                'NQ': 'CME_MINI:NQ1!',  // E-mini Nasdaq
                'YM': 'CBOT:YM1!',      // E-mini Dow
                'RTY': 'CME_MINI:RTY1!', // E-mini Russell
                'CL': 'NYMEX:CL1!',     // Crude Oil
                'GC': 'COMEX:GC1!',     // Gold
                'SI': 'COMEX:SI1!',     // Silver
                'HG': 'COMEX:HG1!',     // Copper
                'NG': 'NYMEX:NG1!',     // Natural Gas
                'ZB': 'CBOT:ZB1!',      // 30Y T-Bond
                'ZN': 'CBOT:ZN1!',      // 10Y T-Note
                'ZF': 'CBOT:ZF1!',      // 5Y T-Note
                'ZT': 'CBOT:ZT1!',      // 2Y T-Note
                '6E': 'CME:6E1!',       // Euro FX
                '6J': 'CME:6J1!',       // Japanese Yen
                '6B': 'CME:6B1!',       // British Pound
                '6C': 'CME:6C1!',       // Canadian Dollar
                'ZC': 'CBOT:ZC1!',      // Corn
                'ZS': 'CBOT:ZS1!',      // Soybeans
                'ZW': 'CBOT:ZW1!',      // Wheat
                'KC': 'KCBT:KE1!',      // KC Wheat
                'CT': 'NYMEX:TT1!'      // Cotton
            },
            'FOREX': {
                'EUR': 'FX:EURUSD',
                'GBP': 'FX:GBPUSD',
                'JPY': 'FX:USDJPY',
                'AUD': 'FX:AUDUSD',
                'CAD': 'FX:USDCAD',
                'CHF': 'FX:USDCHF'
            },
            'CRYPTO': {
                'BTC': 'BINANCE:BTCUSDT',
                'ETH': 'BINANCE:ETHUSDT',
                'SOL': 'BINANCE:SOLUSDT'
            }
        };

        switch (type) {
            case 'FUTURES':
                // Remove =F suffix and get proper exchange symbol
                const baseSymbol = symbol.replace('=F', '');
                return exchangeMap.FUTURES[baseSymbol] || `CME:${baseSymbol}1!`;

            case 'FOREX':
                // Handle forex pairs
                const forexBase = symbol.slice(0, 3);
                return exchangeMap.FOREX[forexBase] || `FX:${symbol}`;

            case 'CRYPTO':
                // Handle crypto pairs
                const cryptoBase = symbol.split('-')[0];
                return exchangeMap.CRYPTO[cryptoBase] || `BINANCE:${cryptoBase}USDT`;

            case 'ETF':
                return `AMEX:${symbol}`;

            case 'STOCK':
            default:
                // Add NYSE/NASDAQ prefix for stocks
                return `${symbol.length > 4 ? 'NASDAQ' : 'NYSE'}:${symbol}`;
        }
    };

    useEffect(() => {
        const containerId = `tradingview_${Math.random().toString(36).substring(7)}`;

        const loadWidget = () => {
            if (container.current) {
                container.current.innerHTML = '';
                container.current.id = containerId;

                const formattedSymbol = getFormattedSymbol(symbol, securityType);

                new window.TradingView.widget({
                    autosize: true,
                    symbol: formattedSymbol,
                    interval: 'D',
                    timezone: 'exchange',
                    theme: 'dark',
                    style: '1',
                    locale: 'en',
                    enable_publishing: false,
                    allow_symbol_change: true,
                    container_id: containerId,
                    hide_side_toolbar: false,
                    studies: [
                        'MASimple@tv-basicstudies',
                        'RSI@tv-basicstudies'
                    ],
                    // Add these options
                    saved_data: null,
                    client_id: null,
                    user_id: null,
                    charts_storage_url: null,
                    charts_storage_api_version: null,
                    width: '100%',
                    height: '100%'
                });
            }
        };

        const loadTradingViewScript = () => {
            return new Promise((resolve) => {
                if (window.TradingView) {
                    resolve();
                    return;
                }

                const script = document.createElement('script');
                script.id = 'tradingview-widget-script';
                script.src = 'https://s3.tradingview.com/tv.js';
                script.async = true;
                script.onload = resolve;
                
                document.body.appendChild(script);
            });
        };

        const initWidget = async () => {
            try {
                if (!scriptLoaded.current) {
                    await loadTradingViewScript();
                    scriptLoaded.current = true;
                }
                loadWidget();
            } catch (error) {
                console.error('TradingView widget error:', error);
            }
        };

        initWidget();

        return () => {
            if (container.current) {
                container.current.innerHTML = '';
            }
        };
    }, [symbol, securityType]);

    return (
        <div 
            ref={container}
            style={{ 
                width: '100%',
                height: '500px',
                backgroundColor: '#131722'
            }}
        />
    );
};

TradingViewWidget.propTypes = {
    symbol: PropTypes.string.isRequired,
    securityType: PropTypes.oneOf(['STOCK', 'ETF', 'FUTURES', 'FOREX', 'CRYPTO']).isRequired
};

export default TradingViewWidget; 