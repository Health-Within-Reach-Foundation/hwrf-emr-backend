const httpStatus = require('http-status');
const { userService } = require('../services');
const ApiError = require('../utils/ApiError');

/**
 * Middleware to check if the user's associated clinic is active.
 *
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @param {Function} next - Express next middleware function.
 *
 * @returns {Promise<void>} - Returns a promise that resolves to void.
 *
 * @throws {ApiError} - Throws an ApiError if there is an internal server error.
 */
const isClinicActive = async (req, res, next) => {
  try {
    // Fetch user with associated clinic and role details
    // TODO: Use getUserByEmail instead of getUserAssociatedToClinic and handle all below code accordingly
    const { user, isSuperAdmin } = await userService.getUserAssociatedToClinic(req.body.email);

    // Allow superadmin to proceed without clinic checks
    if (isSuperAdmin) {
      return next();
    }

    // Check if the user's clinic exists and is active
    if (user.clinic.status === 'active' && user.status === 'active') {
      return next();
    } else if (user.clinic.status === 'pending') {
      console.log('inside pending condition -->');
      return res.status(httpStatus.UNAUTHORIZED).json({
        success: false,
        message: 'Unable to access your account. The clinic is awaiting approval',
      });
    } else if (user.status !== 'active') {
      return res.status(httpStatus.UNAUTHORIZED).json({
        success: false,
        message: 'Unable to access your account. Your account is inactive',
      });
    } else {
      return res.status(httpStatus.UNAUTHORIZED).json({
        success: false,
        message: 'Unauthorized or account inactive',
      });
    }
  } catch (err) {
    console.error('/auth/login - middleware - isClinicActive - error: ', err);
    return next(new ApiError(httpStatus.UNAUTHORIZED, err.message));
  }
};

module.exports = isClinicActive;
