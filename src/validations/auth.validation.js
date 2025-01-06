const Joi = require('joi');
const { password, role } = require('./custom.validation');

const register = {
  body: Joi.object().keys({
    email: Joi.string().required().email(),
    password: Joi.string().required().custom(password),
    name: Joi.string().required(),
    // role: Joi.string().required().custom(role),
    role: Joi.string().required(),
    phoneNumber: Joi.string()
      .pattern(/^[0-9]{10,15}$/)
      .allow('', null)
      .optional(),
  }),
};

const login = {
  body: Joi.object().keys({
    email: Joi.string().required(),
    password: Joi.string().required(),
  }),
};

const logout = {
  body: Joi.object().keys({
    refreshToken: Joi.string().required(),
  }),
};

const refreshTokens = {
  body: Joi.object().keys({
    refreshToken: Joi.string().required(),
  }),
};

const forgotPassword = {
  body: Joi.object().keys({
    email: Joi.string().email().required(),
  }),
};

const resetPassword = {
  query: Joi.object().keys({
    token: Joi.string().required(),
  }),
  body: Joi.object().keys({
    password: Joi.string().required().custom(password),
  }),
};

const verifyEmail = {
  query: Joi.object().keys({
    token: Joi.string().required(),
  }),
};

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
