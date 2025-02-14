const { Op } = require('sequelize');
const { Permission } = require('../models/permission.model');
const { Role } = require('../models/role.model');
const httpStatus = require('http-status');
const ApiError = require('../utils/ApiError');

/**
 * Create a role with associated permissions.
 * @param {string} name - Name of the role.
 * @param {Array<string>} permissions - Array of permission IDs.
 * @returns {Promise<Role>}
 */
const createRoleWithPermissions = async (roleBody, permissions) => {
  // Create role
  const role = await Role.create(roleBody);

  // Associate permissions
  const permissionInstances = await Permission.findAll({
    where: { id: permissions },
  });

  if (permissionInstances.length !== permissions.length) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Some permissions not found');
  }

  await role.addPermissions(permissionInstances);

  return role;
};

/**
 * Bulk creates roles.
 *
 * @param {Array<Object>} roles - An array of role objects to be created.
 * @returns {Promise<Array<Object>>} - A promise that resolves to an array of created role objects.
 */
const bulkCreateRole = async (roles) => {
  return Role.bulkCreate(roles);
};

/**
 * Fetch all roles associated with a clinic along with their permissions
 * @param {string} clinicId - The clinic ID
 * @returns {Promise<Array>} - Array of roles with associated permissions
 */
const getRolesByClinic = async (clinicId) => {
  const clinicRoles = await Role.findAll({
    where: { clinicId },
    attributes: { exclude: ['deletedAt', 'createdAt', 'updatedAt'] }, // Exclude unnecessary fields
    include: [
      {
        model: Permission,
        as: 'permissions', // Alias for permissions association
        attributes: ['id', 'action'], // Fetch only required fields
        through: { attributes: [] }, // Exclude intermediate table fields
      },
    ],
  });

  return clinicRoles;
};

/**
 * Fetch all permissions
 * @returns {Promise<Array<Permission>>}
 */
const getAllPermissions = async () => {
  try {
    const permissions = await Permission.findAll({
      attributes: ['id', 'action'], // Fetch only relevant fields
      order: [['action', 'ASC']], // Optional: Sort permissions alphabetically by action
    });

    if (!permissions.length) {
      throw new Error('No permissions found.');
    }

    return permissions;
  } catch (error) {
    throw new Error(`Failed to fetch permissions: ${error.message}`);
  }
};

/**
 * Update role details and associated permissions
 * @param {string} roleId - The ID of the role to update
 * @param {Object} roleBody - The role details and permissions
 * @returns {Promise<Object>}
 */
const updateRoleWithPermissions = async (roleId, roleBody) => {
  const { roleName, roleDescription, permissions } = roleBody;

  // Start a transaction to ensure atomicity

  try {
    // Find the role to update
    const role = await Role.findByPk(roleId);

    if (!role) {
      throw new Error(`Role with ID ${roleId} not found.`);
    }

    // Update role name and description
    await role.update({
      roleName,
      roleDescription,
    });

    // Validate provided permissions
    const validPermissions = await Permission.findAll({
      where: { id: { [Op.in]: permissions } }, // Use Op.in for array filtering
    });

    console.log('Valid permissions is matching to upcoming permissions', validPermissions.length);
    if (validPermissions.length !== permissions.length) {
      throw new Error('Some permissions are invalid or not found.');
    }

    // Get existing permissions for the role
    const existingPermissions = await role.getPermissions();
    console.log('Existing permissions', existingPermissions);
    const existingPermissionIds = existingPermissions.map((p) => p.id);
    console.log('Existing permission IDs', existingPermissionIds);

    // Find permissions to add (exclude already associated permissions)
    const newPermissionIds = validPermissions
      .map((p) => p.id)
      .filter((id) => !existingPermissionIds.includes(id));

    console.log('New permissions', newPermissionIds);
    // Add only new permissions
    if (newPermissionIds.length > 0) {
      const newPermissions = validPermissions.filter((p) => newPermissionIds.includes(p.id));
      console.log('New permissions to add', newPermissions);
      await role.addPermissions(newPermissions);
    }

    // Remove permissions that are no longer associated with the role
    const permissionsToRemove = existingPermissions.filter((p) => !permissions.includes(p.id));
    if (permissionsToRemove.length > 0) {
      console.log('Permissions to remove', permissionsToRemove);
      await role.removePermissions(permissionsToRemove);
    }

    return {
      id: role.id,
      name: role.name,
      roleDescription: role.roleDescription,
      permissions: validPermissions.map((p) => ({
        id: p.id,
        name: p.name,
      })),
    };
  } catch (error) {
    // Rollback transaction in case of any error
    throw new Error(`Failed to update role: ${error.message}`);
  }
};


module.exports = {
  createRoleWithPermissions,
  bulkCreateRole,
  getRolesByClinic,
  getAllPermissions,
  updateRoleWithPermissions,
};
