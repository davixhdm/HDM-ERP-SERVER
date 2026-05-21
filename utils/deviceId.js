const crypto = require('crypto');

const generateDeviceId = (req) => {
  const userAgent = req.headers['user-agent'] || '';
  const ip = req.headers['x-forwarded-for'] || req.ip || req.connection?.remoteAddress || '';
  return crypto.createHash('md5').update(`${userAgent}:${ip}`).digest('hex');
};

module.exports = { generateDeviceId };