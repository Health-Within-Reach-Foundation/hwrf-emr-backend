/**
 * Middleware to authorize user roles based on required permissions.
 *
 * @param {...string} requiredPermissions - The permissions required to access the resource.
 * @returns {Function} Middleware function to check user roles and permissions.
 *
 * @throws {ApiError} If the user is not authenticated.
 * @throws {ApiError} If the user does not have the required permissions.
 */
const roleAuthorization =
  (...requiredPermissions) =>
  (req, res, next) => {
    try {
      if (!req.user) {
        throw new ApiError(httpStatus.UNAUTHORIZED, 'Please authenticate');
      }

      // Check if the user is an admin
      if (req.user.roles.some((role) => role.name === 'admin')) {
        return next(); // Admins have full access
      }

      // Check if any role has the required permissions
      const hasAccess = req.user.roles.some((role) =>
        role.permissions.some((permission) => requiredPermissions.includes(permission.action))
      );

      if (!hasAccess) {
        throw new ApiError(httpStatus.FORBIDDEN, 'You do not have permission to access this resource');
      }

      next();
    } catch (err) {
      next(err);
    }
  };

module.exports = roleAuthorization;
