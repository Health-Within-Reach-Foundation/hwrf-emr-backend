const httpStatus = require('http-status');
const { superadminServices } = require('../services');
const catchAsync = require('../utils/catchAsync');

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
