const passport = require('passport');
const httpStatus = require('http-status');
const ApiError = require('../utils/ApiError');

/**
 * Middleware callback to verify user authentication and authorization.
 *
 * @param {Object} req - Express request object.
 * @param {Function} resolve - Function to call when verification is successful.
 * @param {Function} reject - Function to call when verification fails.
 * @returns {Function} - Returns an async function that handles the verification process.
 */
const verifyCallback = (req, resolve, reject) => async (err, user, info) => {
  if (err || info || !user) {
    console.log('err property in auth middleware --> ', err);
    console.log('info property in auth middleware --> ', info);
    console.log('user property in auth middleware --> ', user);
    return reject(new ApiError(httpStatus.UNAUTHORIZED, 'Please authenticate'));
  }
  req.user = user;

  // if (requiredRights.length) {
  //   const userRights = roleRights.get(user.role);
  //   const hasRequiredRights = requiredRights.every((requiredRight) => userRights.includes(requiredRight));
  //   if (!hasRequiredRights && req.params.userId !== user.id) {
  //     return reject(new ApiError(httpStatus.FORBIDDEN, 'Forbidden'));
  //   }
  // }

  resolve();
};

/**
 * Middleware to authenticate and authorize a user based on required rights.
 *
 * @returns {Function} Middleware function to authenticate and authorize the user.
 */
const auth = () => async (req, res, next) => {
  return new Promise((resolve, reject) => {
    passport.authenticate('jwt', { session: false }, verifyCallback(req, resolve, reject))(req, res, next);
  })
    .then(() => next())
    .catch((err) => next(err));
};

module.exports = auth;
