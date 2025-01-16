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
