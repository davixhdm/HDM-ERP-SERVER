const jwt = require('jsonwebtoken');
const config = require('../config/env');

const signAccessToken = (payload) => {
  return jwt.sign(payload, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn
  });
};

const signRefreshToken = (payload) => {
  return jwt.sign(payload, config.jwtRefreshSecret, {
    expiresIn: '30d'
  });
};

const verifyAccessToken = (token) => {
  return jwt.verify(token, config.jwtSecret);
};

const verifyRefreshToken = (token) => {
  return jwt.verify(token, config.jwtRefreshSecret);
};

module.exports = {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken
};