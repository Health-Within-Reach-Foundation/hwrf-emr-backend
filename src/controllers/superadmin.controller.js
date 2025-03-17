const httpStatus = require('http-status');
const { superadminServices } = require('../services');
const catchAsync = require('../utils/catchAsync');

/**
 * Controller to get all specialties.
 *
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @returns {Promise<void>} - A promise that resolves to void.
 * @throws {Error} - Throws an error if unable to retrieve specialties.
 */
const getAllSpecialties = catchAsync(async (req, res) => {
  const specialities = await superadminServices.getAllSpecialties();

  res.status(httpStatus.OK).json({
    success: true,
    data: specialities,
    message: 'Specialties retrieved successfully.',
  });
});

module.exports = {
  getAllSpecialties,
};
