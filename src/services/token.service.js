const jwt = require('jsonwebtoken');
const moment = require('moment');
const httpStatus = require('http-status');
const config = require('../config/config');
const userService = require('./user.service');
const ApiError = require('../utils/ApiError');
const { tokenTypes } = require('../config/tokens');
const { Token } = require('../models/token.model');

/**
 * Generate token
 * @param {ObjectId} userId
 * @param {Moment} expires
 * @param {string} type
 * @param {string} [secret]
 * @returns {string}
 */
const generateToken = (userId, expires, type, secret = config.jwt.secret) => {
  const payload = {
    sub: userId,
    iat: moment().unix(),
    exp: expires.unix(),
    type,
  };
  return jwt.sign(payload, secret);
};

/**
 * Save a token
 * @param {string} token
 * @param {ObjectId} userId
 * @param {Moment} expires
 * @param {string} type
 * @param {boolean} [blacklisted]
 * @returns {Promise<Token>}
 */
const saveToken = async (token, userId, expires, type, blacklisted = false) => {
  const tokenDoc = await Token.create({
    token,
    userId,
    type,
    expires: expires.toDate(),
    blacklisted,
  });
  return tokenDoc;
};

/**
 * Verify token and return token doc (or throw an error if it is not valid)
 * @param {string} token
 * @param {string} type
 * @returns {Promise<Token>}
 */
const verifyToken = async (token, type) => {
  const payload = jwt.verify(token, config.jwt.secret);
  const tokenDoc = await Token.findOne({ where: { token, type, userId: payload.sub, blacklisted: false } });
  if (!tokenDoc) {
    throw new Error('Token not found');
  }
  return tokenDoc;
};
/**
 * Verify token, check user validity, and handle token expiration
 * @param {string} token - The access token to verify
 * @returns {Promise<boolean>} - Returns true if the user is valid and the token is expired, false otherwise
 * @throws {Error} - Throws an error if the token is invalid
 */
const verifyAccessToken = async (token) => {
  try {
    // Decode the token
    const payload = jwt.decode(token, config.jwt.secret);

    if (!payload) {
      throw new Error('Access Token Invalid');
    }

    // Check if the user exists
    const user = await userService.getUserById(payload.sub);
    if (!user) {
      return false;
    }

    // Check if the token is expired
    const currentTime = Math.floor(Date.now() / 1000); // Current time in seconds
    if (payload.exp && payload.exp < currentTime) {
      return true; // Token is expired but user is valid
    }

    return false; // Token is still valid, or some other condition fails
  } catch (error) {
    throw new Error('Access Token Invalid');
  }
};


/**
 * Generate auth tokens
 * @param {User} user
 * @returns {Promise<Object>}
 */
const generateAuthTokens = async (user) => {
  const accessTokenExpires = moment().add(config.jwt.accessExpirationMinutes, 'minutes');
  const accessToken = generateToken(user.id, accessTokenExpires, tokenTypes.ACCESS);

  const refreshTokenExpires = moment().add(config.jwt.refreshExpirationDays, 'hours');
  const refreshToken = generateToken(user.id, refreshTokenExpires, tokenTypes.REFRESH);
  await saveToken(refreshToken, user.id, refreshTokenExpires, tokenTypes.REFRESH);

  return {
    access: {
      token: accessToken,
      expires: accessTokenExpires.toDate(),
    },
    refresh: {
      token: refreshToken,
      expires: refreshTokenExpires.toDate(),
    },
  };
};
/**
 * Generate auth tokens
 * @param {User} user
 * @param {Token} user
 * @returns {Promise<Object>}
 */
const generateAccessTokenOnly = async (user) => {
  const accessTokenExpires = moment().add(config.jwt.accessExpirationMinutes, 'minutes');
  const accessToken = generateToken(user.id, accessTokenExpires, tokenTypes.ACCESS);

  return {
    access: {
      token: accessToken,
      expires: accessTokenExpires.toDate(),
    },
  };
};

/**
 * Generate reset password token
 * @param {string} email
 * @returns {Promise<string>}
 */
const generatePasswordToken = async (email, type) => {
  const user = await userService.getUserByEmail(email);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'No users found with this email');
  }
  const expires = moment().add(config.jwt.accessExpirationMinutes, 'days');
  console.log('Expired in -->', expires);
  const passwordToken = generateToken(user.id, expires, type);
  await saveToken(passwordToken, user.id, expires, type);
  return passwordToken;
};

/**
 * Generate verify email token
 * @param {User} user
 * @returns {Promise<string>}
 */
const generateVerifyEmailToken = async (user) => {
  const expires = moment().add(config.jwt.verifyEmailExpirationMinutes, 'minutes');
  const verifyEmailToken = generateToken(user.id, expires, tokenTypes.VERIFY_EMAIL);
  await saveToken(verifyEmailToken, user.id, expires, tokenTypes.VERIFY_EMAIL);
  return verifyEmailToken;
};

/**
 * Generate reset password token
 * @param {string} email
 * @returns {Promise<string>}
 */

module.exports = {
  generateToken,
  saveToken,
  verifyToken,
  generateAuthTokens,
  generatePasswordToken,
  generateVerifyEmailToken,
  generateAccessTokenOnly,
  verifyAccessToken,
};
