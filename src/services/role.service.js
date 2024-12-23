const { Role } = require('../models/role.model');

/**
 *
 * @param {Object} roleBody
 */
const createRole = async (roleBody, user) => {
  console.log('inside createRole -->', roleBody);
  const isRoleExist = await Role.findOne({ where: { roleName: roleBody.roleName, clinicId: roleBody.clinicId } });
  if (isRoleExist) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Role already has been there for the clinic');
  }
  const role = await Role.create(roleBody);
  user.addRoles(role);
  return role;
};

module.exports = { createRole };
