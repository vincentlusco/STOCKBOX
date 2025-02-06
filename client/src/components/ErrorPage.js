import React from 'react';
import { useRouteError } from 'react-router-dom';

const ErrorPage = () => {
  const error = useRouteError();

  return (
    <div style={{
      padding: '20px',
      color: '#00ff00',
      backgroundColor: '#1e1e1e',
      height: '100vh',
      fontFamily: 'monospace'
    }}>
      <h1>Oops! Something went wrong.</h1>
      <pre>{error?.message || 'Unknown error occurred'}</pre>
      <p>Please try refreshing the page or navigating back.</p>
      <button 
        onClick={() => window.location.href = '/'}
        style={{
          backgroundColor: 'transparent',
          border: '1px solid #00ff00',
          color: '#00ff00',
          padding: '8px 16px',
          cursor: 'pointer',
          fontFamily: 'monospace',
          marginTop: '20px'
        }}
      >
        Return Home
      </button>
    </div>
  );
};

export default ErrorPage; 