const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const { rolePermissionService } = require('../services');
const db = require('../models');
const ApiError = require('../utils/ApiError');

/**
 * Create a new role with permissions.
 *
 * @param {Object} req - Express request object.
 * @param {Object} req.body - Request body.
 * @param {string} req.body.roleName - Name of the role.
 * @param {Array<string>} req.body.permissions - List of permissions for the role.
 * @param {string} req.body.roleDescription - Description of the role.
 * @param {Object} req.user - Authenticated user object.
 * @param {string} req.user.clinicId - ID of the clinic.
 * @param {Object} res - Express response object.
 * @returns {Promise<void>} - Returns a promise that resolves to void.
 */
const createRole = catchAsync(async (req, res) => {
  const transaction = await db.sequelize.transaction();
  try {
    const { roleName, permissions, roleDescription } = req.body;
    const clinicId = req.user.clinicId;
    const roleBody = { roleName, roleDescription, clinicId };
    const role = await rolePermissionService.createRoleWithPermissions(roleBody, permissions, transaction);
    await transaction.commit();
    res.status(httpStatus.CREATED).json({
      success: true,
      message: 'Role created successfully',
      data: role,
    });
  } catch (error) {
    await transaction.rollback();
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Role creation failed');
  }
});

/**
 * Get roles by clinic.
 *
 * This function retrieves roles associated with a specific clinic based on the clinic ID
 * obtained from the authenticated user's request object.
 *
 * @param {Object} req - Express request object.
 * @param {Object} req.user - Authenticated user object.
 * @param {string} req.user.clinicId - Clinic ID associated with the authenticated user.
 * @param {Object} res - Express response object.
 *
 * @returns {Promise<void>} - A promise that resolves to sending a JSON response with the roles data.
 */
const getRolesByClinic = catchAsync(async (req, res) => {
  console.log(req.user);
  const clinicId = req.user.clinicId;

  const roles = await rolePermissionService.getRolesByClinic(clinicId);

  res.status(httpStatus.OK).json({
    success: true,
    data: roles,
    message: 'Roles retrieved successfully.',
  });
});

/**
 * Controller to get all permissions.
 *
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @returns {Promise<void>} - Returns a promise that resolves to void.
 * @throws {Error} - Throws an error if unable to retrieve permissions.
 */
const getAllPermissions = catchAsync(async (req, res) => {
  const permissions = await rolePermissionService.getAllPermissions();

  res.status(httpStatus.OK).json({
    success: true,
    data: permissions,
    message: 'Permissions retrived successfully.',
  });
});

/**
 * Updates a role with the provided data and permissions.
 *
 * @param {Object} req - The request object.
 * @param {Object} req.query - The query parameters.
 * @param {string} req.query.roleId - The ID of the role to update.
 * @param {Object} req.body - The body of the request containing role data.
 * @param {Object} res - The response object.
 * @returns {Promise<void>} - A promise that resolves when the role is updated.
 */
const updateRole = catchAsync(async (req, res) => {
  const transaction = await db.sequelize.transaction();
  try {
    const roleId = req.query.roleId;
    const roleData = req.body;
    // const { name, permissions } = req.body;
    console.group('Role Data', roleData, roleId);
    await rolePermissionService.updateRoleWithPermissions(roleId, roleData);

    res.status(httpStatus.OK).json({
      success: true,
      message: 'Role updated successfully',
      // data: role,
    });
  } catch (error) {
    await transaction.rollback();
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Role update failed');
  }
});

module.exports = {
  createRole,
  getRolesByClinic,
  getAllPermissions,
  updateRole,
};
