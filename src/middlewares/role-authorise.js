const httpStatus = require('http-status');
const ApiError = require('../utils/ApiError');

/**
 * Middleware to check user's permissions for accessing specific APIs
 * @param {...string} requiredPermissions - Array of required permissions for the route
 * @returns {Function} Middleware function for permission-based access control
 */
const roleAuthorization = (...requiredPermissions) => (req, res, next) => {
  try {
    // Ensure user is authenticated
    if (!req.user) {
      throw new ApiError(httpStatus.UNAUTHORIZED, 'Please authenticate');
    }

    console.log('Required permissions:', requiredPermissions);
    console.log('User permissions:', req.user.permissions);

    // Check if the user has all required permissions
    const hasAccess = requiredPermissions.every((perm) => req.user.permissions.includes(perm));
    if (!hasAccess) {
      throw new ApiError(httpStatus.FORBIDDEN, 'You do not have permission to access this resource');
    }

    next();
  } catch (err) {
    next(err);
  }
};

module.exports = roleAuthorization;
