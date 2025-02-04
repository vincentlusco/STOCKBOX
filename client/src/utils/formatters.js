export const formatPrice = (num) => {
  if (!num && num !== 0) return '-';
  return num.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

export const formatLargeNumber = (num) => {
  if (!num && num !== 0) return '-';
  if (num >= 1e12) return (num / 1e12).toFixed(2) + 'T';
  if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
  if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
  if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K';
  return num.toLocaleString();
};

export const formatPercent = (num) => {
  if (!num && num !== 0) return '-';
  return num.toFixed(2) + '%';
};

export const formatNumber = (num) => {
  if (!num && num !== 0) return '-';
  return num.toLocaleString();
}; 