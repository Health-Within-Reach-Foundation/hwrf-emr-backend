// const mongoose = require('mongoose');
const httpStatus = require('http-status');
const config = require('../config/config');
const logger = require('../config/logger');
const ApiError = require('../utils/ApiError');

/**
 * Middleware to convert errors into a consistent API error format.
 * @param {Error} err - The error object that was thrown in the previous middleware.
 * @param {Object} req - The HTTP request object.
 * @param {Object} res - The HTTP response object.
 * @param {function} next - The next middleware function to be called.
 * @returns {void}
 */
const errorConverter = (err, req, res, next) => {
  let error = err;
  if (!(error instanceof ApiError)) {
    const statusCode =error.statusCode
      // error.statusCode || error instanceof mongoose.Error ? httpStatus.BAD_REQUEST : httpStatus.INTERNAL_SERVER_ERROR;
    const message = error.message || httpStatus[statusCode];
    error = new ApiError(statusCode, message, false, err.stack);
  }
  next(error);
};

// eslint-disable-next-line no-unused-vars
/**
 * Error handling middleware.
 *
 * @param {Object} err - The error object.
 * @param {number} err.statusCode - The HTTP status code.
 * @param {string} err.message - The error message.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @param {Function} next - The next middleware function.
 */
const errorHandler = (err, req, res, next) => {
  let { statusCode, message } = err;
  if (config.env === 'production' && !err.isOperational) {
    statusCode = httpStatus.INTERNAL_SERVER_ERROR;
    message = httpStatus[httpStatus.INTERNAL_SERVER_ERROR];
  }

  res.locals.errorMessage = err.message;

  const response = {
    code: statusCode,
    message,
    ...(config.env === 'development' && { stack: err.stack }),
  };

  if (config.env === 'development') {
    logger.error(err);
  }

  res.status(statusCode).send(response);
};

module.exports = {
  errorConverter,
  errorHandler,
};
