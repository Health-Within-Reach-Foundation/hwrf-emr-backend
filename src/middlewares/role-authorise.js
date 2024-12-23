const httpStatus = require('http-status');
const ApiError = require('../utils/ApiError');

/**
 * Middleware to check user's role for accessing specific APIs
 * @param {string[]} allowedRoles - Array of roles allowed to access the route
 * @returns {Function} Middleware function for role-based access control
 */
const roleAuthorization = (...allowedRoles) => (req, res, next) => {
  try {
    // Ensure user is authenticated (already handled by passport-jwt)
    if (!req.user) {
      throw new ApiError(httpStatus.UNAUTHORIZED, 'Please authenticate');
    }

    // Extract user's roles from the authenticated user object
    const userRoles = req.user.roles.map((role) => role.roleName); // Assuming roles are populated in req.user
    const hasAccess = allowedRoles.some((role) => userRoles.includes(role));

    if (!hasAccess) {
      throw new ApiError(httpStatus.FORBIDDEN, 'You do not have permission to access this resource');
    }

    next();
  } catch (err) {
    next(err);
  }
};

module.exports = roleAuthorization;
