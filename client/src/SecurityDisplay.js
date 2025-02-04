const DataContainer = styled('pre')({
  color: 'var(--terminal-green)',
  fontFamily: 'Courier New, monospace',
  padding: '20px',
  margin: 0,
  overflow: 'auto',
  height: '100%',
  backgroundColor: 'var(--terminal-black)',
  whiteSpace: 'pre-wrap',
  fontSize: '14px'
});

const LoadingIndicator = styled('div')({
  animation: 'blink 1s infinite',
  '@keyframes blink': {
    '0%': { opacity: 0 },
    '50%': { opacity: 1 },
    '100%': { opacity: 0 }
  }
});

const SecurityDisplay = ({ data, isLoading, error }) => {
  if (isLoading) return (
    <DataContainer>
      <LoadingIndicator>
        Fetching data for {data.symbol}...
        <br />
        Last update: {new Date().toLocaleTimeString()}
      </LoadingIndicator>
    </DataContainer>
  );
}; 