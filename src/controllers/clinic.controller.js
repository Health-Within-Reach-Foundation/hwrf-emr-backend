const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const { clinicService } = require('../services');

/**
 * Get a list of clinics with pagination, filtering, and sorting
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
const getClinics = catchAsync(async (req, res) => {
  // Extract query parameters from the request
  const queryOptions = {
    status: req.query.status, // Filter by status (optional)
    // page: parseInt(req.query.page, 10) || 1, // Default to page 1
    // limit: parseInt(req.query.limit, 10) || 10, // Default to 10 records per page
    sortBy: req.query.sortBy || 'createdAt', // Default sorting column
    order: req.query.order || 'desc', // Default sorting order
  };

  // Call the service and get the structured response
  const clinicsResponse = await clinicService.getClinics(queryOptions);

  // Send the response directly from the service
  return res.status(httpStatus.OK).json(clinicsResponse);
});

const getClinic = catchAsync(async (req, res) => {
  const clinicResponse = await clinicService.getClinic(req.params.clinicId);

  return res.status(httpStatus.OK).json(clinicResponse);
});

const approveClinic = catchAsync(async (req, res) => {
  const clinicResponse = await clinicService.updateClinicById(req.params.clinicId, req.body);

  return res.status(httpStatus.OK).json({
    success: true,
    data: clinicResponse,
  });
});


module.exports = {
  getClinics,
  getClinic,
  approveClinic,
};
