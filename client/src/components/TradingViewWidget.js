import React, { useEffect, useRef } from 'react';

const TradingViewWidget = ({ symbol }) => {
    const container = useRef();

    useEffect(() => {
        const script = document.createElement('script');
        script.src = 'https://s3.tradingview.com/tv.js';
        script.async = true;
        script.onload = () => {
            if (window.TradingView && container.current) {
                new window.TradingView.widget({
                    "width": "100%",
                    "height": "500",
                    "symbol": symbol,
                    "interval": "D",
                    "timezone": "exchange",
                    "theme": "dark",
                    "style": "1",
                    "toolbar_bg": "#f1f3f6",
                    "withdateranges": true,
                    "allow_symbol_change": false,
                    "save_image": false,
                    "container_id": "tradingview_widget",
                    "studies": [
                        "MASimple@tv-basicstudies",
                        "Volume@tv-basicstudies"
                    ]
                });
            }
        };

        // Clean up previous content
        if (container.current) {
            container.current.innerHTML = '<div id="tradingview_widget"></div>';
        }
        
        // Add script
        document.head.appendChild(script);

        return () => {
            // Cleanup
            if (container.current) {
                container.current.innerHTML = '';
            }
            document.head.removeChild(script);
        };
    }, [symbol]);

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

export default TradingViewWidget; 