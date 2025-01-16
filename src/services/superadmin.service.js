const ApiError = require('../utils/ApiError');
const { Specialty } = require('../models/specialty.model');

const getAllSpecialties = async () => {
  // Fetch clinic along with associated specialties
  const specialities = await Specialty.findAll();

  if (!specialities) {
    throw new ApiError(httpStatus.NOT_FOUND, 'specialities not found');
  }

  return specialities;
};

module.exports = {
  getAllSpecialties,
};
