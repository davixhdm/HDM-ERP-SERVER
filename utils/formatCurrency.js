const formatCurrency = (amount, currency = 'KSh') => {
  try {
    const formatter = new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2
    });
    return formatter.format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
};

module.exports = formatCurrency;