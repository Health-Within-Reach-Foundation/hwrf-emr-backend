const { Role } = require('../models/role.model');

/**
 * Creates a new role and assigns it to the user.
 *
 * @param {Object} roleBody - The data for the new role.
 * @param {Object} user - The user to whom the role will be assigned.
 * @returns {Promise<Object>} The created role.
 */
const createRole = async (roleBody, user) => {
  console.log('inside createRole -->', roleBody);
  const role = await Role.create(roleBody);
  user.addRoles(role);
  return role;
};

module.exports = { createRole };
