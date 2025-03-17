/**
 * Class representing an API error.
 * @extends Error
 */
class ApiError extends Error {
  
  /**
   * Create an API error.
   * @param {number} statusCode - The HTTP status code of the error.
   * @param {string} message - The error message.
   * @param {boolean} [isOperational=true] - Whether the error is operational (default is true).
   * @param {string} [stack=''] - The stack trace (default is an empty string).
   */
  constructor(statusCode, message, isOperational = true, stack = '') {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

module.exports = ApiError;
