const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const { clinicService, userService } = require('../services');

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

/**
 * Get all users associated with a clinic
 * @route GET /users/clinic
 * @access Admin (Clinic Level)
 */
const getUsersByClinic = catchAsync(async (req, res) => {
  // Extract clinicId from the logged-in admin's session or token
  const clinicId = req.user.clinicId;
  console.log('Checking the getUSersByClinic controller');
  // Fetch users from the service
  const users = await userService.getUsersByClinic(clinicId);

  // Send response
  res.status(httpStatus.OK).json({
    success: true,
    message: 'Users retrieved successfully.',
    data: users,
  });
});

const getSpecialtyDepartmentsByClinic = catchAsync(async (req, res) => {
  const clinicId = req.user.clinicId;

  const departments = await clinicService.getSpecialtyDepartmentsByClinic(clinicId);

  res.status(httpStatus.OK).json({
    success: true,
    data: departments,
    message: 'Specialties retrieved successfully.',
  });
});

const createRole = catchAsync(async (req, res) => {
  const roleBody = {
    ...req.body,
    clinicId: req.user.clinicId,
  };
  const role = await clinicService.createRoleUnderClinc(roleBody);

  res.status(httpStatus.CREATED).json({
    success: true,
    data: role,
    message: 'Role created successfully.',
  });
});

const getRolesByClinic = catchAsync(async (req, res) => {
  const clinicId = req.user.clinicId;

  const roles = await clinicService.getRolesByClinic(clinicId);

  res.status(httpStatus.OK).json({
    success: true,
    data: roles,
    message: 'Roles retrieved successfully.',
  });
});



module.exports = {
  getClinics,
  getClinic,
  approveClinic,
  getUsersByClinic,
  getSpecialtyDepartmentsByClinic,
  createRole,
  getRolesByClinic
};
