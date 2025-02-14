/**
 * A higher-order function that wraps an asynchronous function and catches any errors that occur,
 * passing them to the next middleware in the Express.js request-response cycle.
 *
 * @param {Function} fn - The asynchronous function to be wrapped. It should accept three parameters: req, res, and next.
 * @returns {Function} A new function that wraps the original function with error handling.
 */
const catchAsync = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch((err) => next(err));
};

module.exports = catchAsync;
