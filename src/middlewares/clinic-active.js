const httpStatus = require('http-status');
const { userService } = require('../services');
const ApiError = require('../utils/ApiError');

const isClinicActive = async (req, res, next) => {
  try {
    // Fetch user with associated clinic and role details
    const { user, isSuperAdmin } = await userService.getUserWithAssociatedClinic(req.body.email);

    // Allow superadmin to proceed without clinic checks
    if (isSuperAdmin) {
      return next();
    }

    // Check if the user's clinic exists and is active
    if (user.clinic.status === 'active') {
      return next();
    } else if (user.clinic.status === 'pending') {
      console.log('inside pending condition -->');
      return res.status(httpStatus.UNAUTHORIZED).json({
        success: false,
        message: 'Unable to access your account. The clinic is awaiting approval',
      });
    } else {
      return res.status(httpStatus.UNAUTHORIZED).json({
        success: false,
        message: 'Unauthorized or account inactive',
      });
    }
  } catch (err) {
    next(new ApiError(httpStatus.UNAUTHORIZED, 'Internal server error !'));
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Internal server error!',
    });
  }
};

module.exports = isClinicActive;
