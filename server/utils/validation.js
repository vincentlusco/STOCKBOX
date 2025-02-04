const validateNumber = (num) => {
  if (typeof num !== 'number' || isNaN(num)) return 0;
  return num;
};

const validateString = (str) => {
  if (typeof str !== 'string') return '-';
  return str;
};

const validateDate = (date) => {
  if (!date) return '-';
  try {
    return new Date(date).toISOString().split('T')[0];
  } catch {
    return '-';
  }
};

const validateArray = (arr, defaultValue = []) => {
  if (!Array.isArray(arr)) return defaultValue;
  return arr;
};

const validateObject = (obj, defaultValue = {}) => {
  if (!obj || typeof obj !== 'object') return defaultValue;
  return obj;
};

module.exports = {
  validateNumber,
  validateString,
  validateDate,
  validateArray,
  validateObject
}; 