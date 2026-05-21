const rates = {
  KSh: { USD: 0.0065, EUR: 0.0060, GBP: 0.0052, KSh: 1 },
  USD: { KSh: 153.85, EUR: 0.92, GBP: 0.79, USD: 1 },
  EUR: { KSh: 166.67, USD: 1.09, GBP: 0.86, EUR: 1 },
  GBP: { KSh: 192.31, USD: 1.26, EUR: 1.16, GBP: 1 }
};

const convert = (amount, fromCurrency, toCurrency) => {
  if (fromCurrency === toCurrency) return amount;
  const rate = rates[fromCurrency]?.[toCurrency];
  if (!rate) throw new Error(`Conversion rate not available for ${fromCurrency} to ${toCurrency}`);
  return amount * rate;
};

const formatCurrency = (amount, currency) => {
  return new Intl.NumberFormat('en-KE', { style: 'currency', currency: currency === 'KSh' ? 'KES' : currency }).format(amount);
};

module.exports = { convert, formatCurrency };