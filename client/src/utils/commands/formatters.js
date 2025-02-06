export const formatters = {
  price: (value) => {
    if (!value) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
  },

  number: (value) => {
    if (!value) return 'N/A';
    return new Intl.NumberFormat('en-US').format(value);
  },

  percent: (value) => {
    if (!value) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'percent',
      minimumFractionDigits: 2
    }).format(value);
  },

  largeNumber: (value) => {
    if (!value) return 'N/A';
    const suffixes = ['', 'K', 'M', 'B', 'T'];
    const suffixNum = Math.floor(Math.log10(Math.abs(value)) / 3);
    const shortValue = (value / Math.pow(1000, suffixNum));
    return `$${shortValue.toFixed(2)}${suffixes[suffixNum]}`;
  },

  technical: {
    formatRSI: (val) => {
      if (!val) return 'N/A';
      const color = val > 70 ? 'RED' : val < 30 ? 'GREEN' : 'YELLOW';
      return `${val.toFixed(2)} [${color}]`;
    },
    
    formatMACD: (macd) => {
      if (!macd) return 'N/A';
      return {
        macd: macd.macd?.toFixed(2) || 'N/A',
        signal: macd.signal?.toFixed(2) || 'N/A',
        histogram: macd.histogram?.toFixed(2) || 'N/A'
      };
    }
  }
}; 