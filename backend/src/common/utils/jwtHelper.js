const jwt = require('jsonwebtoken');
const env = require('../../config/environment');

const signAccessToken = (payload) => {
  return jwt.sign(payload, env.jwt.secret, {
    expiresIn: env.jwt.expire
  });
};

const signRefreshToken = (payload) => {
  return jwt.sign(payload, env.jwt.refreshSecret, {
    expiresIn: env.jwt.refreshExpire
  });
};

const verifyAccessToken = (token) => {
  return jwt.verify(token, env.jwt.secret);
};

const verifyRefreshToken = (token) => {
  return jwt.verify(token, env.jwt.refreshSecret);
};

module.exports = {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken
};

