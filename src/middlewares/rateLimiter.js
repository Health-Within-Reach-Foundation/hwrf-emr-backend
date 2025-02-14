const rateLimit = require('express-rate-limit');

/**
 * Middleware to limit repeated requests to public APIs.
 * 
 * This rate limiter allows a maximum of 20 requests per 15 minutes window per IP address.
 * Successful requests are not counted towards the limit.
 * 
 * @constant {Object} authLimiter - The rate limiter middleware configuration.
 * @property {number} windowMs - The time frame for which requests are checked/remembered (in milliseconds).
 * @property {number} max - The maximum number of requests allowed within the windowMs time frame.
 * @property {boolean} skipSuccessfulRequests - Whether to skip counting successful requests towards the limit.
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  skipSuccessfulRequests: true,
});

module.exports = {
  authLimiter,
};
