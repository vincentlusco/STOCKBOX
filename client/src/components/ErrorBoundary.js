import React from 'react';

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
                <div style={{ 
                    color: '#00ff00',
                    backgroundColor: '#1e1e1e',
                    padding: '20px',
                    fontFamily: 'monospace'
                }}>
                    <h3>Component Error</h3>
                    <pre>{this.state.error?.message}</pre>
                    <button 
                        onClick={() => this.setState({ hasError: false, error: null })}
                        style={{
                            backgroundColor: 'transparent',
                            border: '1px solid #00ff00',
                            color: '#00ff00',
                            padding: '8px 16px',
                            cursor: 'pointer',
                            marginTop: '10px'
                        }}
                    >
                        Try Again
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary; 