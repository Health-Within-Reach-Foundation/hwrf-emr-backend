const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const { rolePermissionService } = require('../services');

const createRole = catchAsync(async (req, res) => {
  const { name, permissions } = req.body;
  const role = await rolePermissionService.createRoleWithPermissions(name, permissions);

  res.status(httpStatus.CREATED).json({
    success: true,
    message: 'Role created successfully',
    data: role,
  });
});

const getRolesByClinic = catchAsync(async (req, res) => {
  const clinicId = req.user.clinicId;

  const roles = await rolePermissionService.getRolesByClinic(clinicId);

  res.status(httpStatus.OK).json({
    success: true,
    data: roles,
    message: 'Roles retrieved successfully.',
  });
});

const getAllPermissions = catchAsync(async (req, res) => {
  const permissions = await rolePermissionService.getAllPermissions();

  res.status(httpStatus.OK).json({
    success: true,
    data: permissions,
    message: 'Permissions retrived successfully.',
  });
});

const updateRole = catchAsync(async (req, res) => {
  const roleId = req.query.roleId;
  const roleData = req.body;
  // const { name, permissions } = req.body;
  await rolePermissionService.updateRoleWithPermissions(roleId, roleData);

  res.status(httpStatus.OK).json({
    success: true,
    message: 'Role updated successfully',
    // data: role,
  });
});

module.exports = {
  createRole,
  getRolesByClinic,
  getAllPermissions,
  updateRole,
};
