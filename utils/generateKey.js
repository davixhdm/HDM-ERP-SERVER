const crypto = require('crypto');

const generateLicenseKey = (prefix = 'HDM') => {
  const blocks = [];
  for (let i = 0; i < 4; i++) {
    blocks.push(crypto.randomBytes(2).toString('hex').toUpperCase());
  }
  return `${prefix}-${blocks.join('-')}`;
};

const generateApiKey = (prefix = 'hdm_sk') => {
  const randomPart = crypto.randomBytes(24).toString('hex');
  return `${prefix}_${randomPart}`;
};

const generateRandomString = (length = 32) => {
  return crypto.randomBytes(length).toString('hex').slice(0, length);
};

module.exports = { generateLicenseKey, generateApiKey, generateRandomString };