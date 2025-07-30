const Joi = require('joi');
const { password, role } = require('./custom.validation');

/**
 * Joi validation schema for register (Superadmin register)
 */
const register = {
  body: Joi.object().keys({
    email: Joi.string().required().email(),
    name: Joi.string().required(),
    role: Joi.string().required(),
    phoneNumber: Joi.string()
      .pattern(/^[0-9]{10,15}$/)
      .allow('', null)
      .optional(),
  }),
};

/**
 * Joi validation schema for login
 */
const login = {
  body: Joi.object().keys({
    email: Joi.string().required(),
    password: Joi.string().required(),
  }),
};

/**
 * Joi validation schema for logout
 */
const logout = {
  body: Joi.object().keys({
    refreshToken: Joi.string().required(),
  }),
};

/**
 * Joi validation schema for refresh tokens
 */
const refreshTokens = {
  body: Joi.object().keys({
    refreshToken: Joi.string().required(),
    accessToken: Joi.string().required(),
  }),
};

/**
 * Joi validation schema for forgot password
 */
const forgotPassword = {
  body: Joi.object().keys({
    email: Joi.string().email().required(),
  }),
};

/**
 * Joi validation schema for reset password
 */
const resetPassword = {
  query: Joi.object().keys({
    token: Joi.string().required(),
  }),
  body: Joi.object().keys({
    password: Joi.string().required().custom(password),
  }),
};

/**
 * Joi validation schema for verify email
 */
const verifyEmail = {
  query: Joi.object().keys({
    token: Joi.string().required(),
  }),
};

/**
 * Joi validation schema for getMe
 */
const getMe = {
  headers: Joi.object()
    .keys({
      authorization: Joi.string()
        .required()
        .regex(/^Bearer\s[\w-]+\.[\w-]+\.[\w-]+$/) // Validate Bearer token format
        .messages({ 'string.pattern.base': 'Invalid Authorization header format' }),
    })
    .unknown(true), // Allow other headers to pass through
};

module.exports = {
  register,
  login,
  logout,
  refreshTokens,
  forgotPassword,
  resetPassword,
  verifyEmail,
  getMe,
};
