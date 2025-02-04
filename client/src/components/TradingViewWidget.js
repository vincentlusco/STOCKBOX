import React, { useEffect, useRef } from 'react';

const TradingViewWidget = ({ symbol }) => {
    const container = useRef();

    useEffect(() => {
        if (!symbol) return;

        const script = document.createElement('script');
        script.src = 'https://s3.tradingview.com/tv.js';
        script.async = true;
        script.onload = () => {
            if (window.TradingView) {
                new window.TradingView.widget({
                    autosize: true,
                    symbol: `${symbol}`,
                    interval: 'D',
                    timezone: 'America/New_York',
                    theme: 'dark',
                    style: '1',
                    locale: 'en',
                    toolbar_bg: '#f1f3f6',
                    enable_publishing: false,
                    allow_symbol_change: true,
                    container_id: 'tradingview_chart'
                });
            }
        };
        container.current.appendChild(script);

        return () => {
            if (container.current) {
                container.current.innerHTML = '';
            }
        };
    }, [symbol]);

    return (
        <div ref={container}>
            <div id="tradingview_chart" style={{ height: '500px' }} />
        </div>
    );
};

export default TradingViewWidget; 