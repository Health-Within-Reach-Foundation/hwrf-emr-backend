const httpStatus = require('http-status');
const ApiError = require('../utils/ApiError');
const { User } = require('../models/user.model');
const { Role } = require('../models/role.model');
const { Clinic } = require('../models/clinic.model');
const { Specialty } = require('../models/specialty.model');
const { Camp } = require('../models/camp.model');
const { Permission } = require('../models/permission.model');

/**
 * Create a user
 * @param {Object} userBody
 * @returns {Promise<User>}
 */
const createUser = async (userBody) => {
  if (await User.isEmailTaken(userBody.email)) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Email already taken');
  }
  return User.create(userBody);
};

/**
 * Get user by id
 * @param {ObjectId} id
 * @returns {Promise<User>}
 */
const getUserById = async (id) => {
  console.log('hello getting user from auth/me');
  return User.findByPk(id, {
    include: [
      {
        model: Role,
        as: 'roles',
        through: { attributes: [] }, // Exclude junction table
        include: [
          {
            model: Permission, // Include permissions for roles
            as: 'permissions',
            attributes: ['id', 'action'], // Fetch permission details
            through: { attributes: [] }, // Exclude intermediate fields
          },
        ],
        attributes: { exclude: ['createdAt', 'updatedAt', 'userId', 'clinicId'] }, // Clean unnecessary fields
      },
      {
        model: Clinic,
        as: 'clinic', // Assuming Clinic has alias 'clinic' in User model
        attributes: ['id', 'clinicName', 'status'], // Only required fields
      },
      {
        model: Specialty,
        as: 'specialties', // Assuming User has a many-to-many relationship with Specialty
        through: { attributes: [] }, // Exclude intermediate fields
        attributes: ['id', 'name', 'departmentName'], // Minimal required fields
      },
      {
        model: Camp,
        as: 'camps',
        through: { attributes: [] },
        where: { status: 'active' },
        required: false,
        attributes: { exclude: ['clinicId', 'updatedAt'] },
      },
    ],
  });
};

/**
 * Get user by email
 * @param {string} email
 * @returns {Promise<User>}
 */
const getUserByEmail = async (email) => {
  return User.findOne({
    where: { email },
    attributes: { include: ['password'] },
    include: [
      {
        model: Role,
        as: 'roles',
        through: { attributes: [] }, // Exclude junction table
        include: [
          {
            model: Permission, // Include permissions for roles
            as: 'permissions',
            attributes: ['id', 'action'], // Fetch permission details
            through: { attributes: [] }, // Exclude intermediate fields
            required: false,
          },
        ],
        required: false,
        attributes: { exclude: ['createdAt', 'updatedAt', 'userId', 'clinicId'] }, // Clean unnecessary fields
      },
      {
        model: Clinic,
        as: 'clinic', // Assuming Clinic has alias 'clinic' in User model
        attributes: ['id', 'clinicName', 'status'], // Only required fields
        required: false,
      },
      {
        model: Specialty,
        as: 'specialties', // Assuming User has a many-to-many relationship with Specialty
        through: { attributes: [] }, // Exclude intermediate fields
        attributes: ['id', 'name', 'departmentName'], // Minimal required fields
        required: false,
      },
      {
        model: Camp,
        as: 'camps',
        through: { attributes: [] },
        where: { status: 'active' },
        attributes: { exclude: ['clinicId', 'updatedAt'] },
        required: false,
      },
    ],
  });
};

const getUserAssociatedToClinic = async (userEmail) => {
  console.log('userid -->', userEmail);
  const user = await User.findOne({
    where: {
      email: userEmail,
    },
    include: [
      {
        model: Clinic,
        as: 'clinic',
        attributes: { exclude: ['createdAt', 'updatedAt'] },
      },
      {
        model: Role,
        as: 'roles',
        through: { attributes: [] }, // Exclude intermediate table fields
        attributes: { exclude: ['createdAt', 'updatedAt', 'userId', 'clinicId'] },
      },
    ],
  });

  // Check if user exists
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }

  // Check if the user is a superadmin
  const isSuperAdmin = user.roles.some((role) => role.roleName === 'superadmin');
  console.log('asdfghjkl', isSuperAdmin);
  if (isSuperAdmin) {
    return { user, isSuperAdmin: true };
  }

  // If not superadmin, ensure user has a clinic associated
  if (!user.clinic) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'User has no associated clinic');
  }
  console.log('returnning user from getUserAssociatedToClinic -->', user.clinic.status);
  return { user, isSuperAdmin: false };
};

/**
 * Get all users associated with a specific clinic
 * @param {String} clinicId - ID of the clinic
 * @returns {Promise<Array>} - List of users with their roles
 */
const getUsersByClinic = async (clinicId) => {
  // Query users associated with the given clinicId
  const users = await User.findAll({
    where: { clinicId }, // Filter by clinicId
    attributes: ['id', 'name', 'email', 'phoneNumber', 'specialist', 'createdAt', 'updatedAt'], // Select required fields
    include: [
      {
        model: Role, // Include roles associated with the user
        as: 'roles',
        attributes: ['id', 'roleName'], // Include role details
        through: { attributes: [] }, // Exclude junction table attributes
      },
      {
        model: Specialty,
        as: 'specialties', // Assuming User has a many-to-many relationship with Specialty
        through: { attributes: [] }, // Exclude intermediate fields
        attributes: ['id', 'name', 'departmentName'], // Minimal required fields
      },
      {
        model: Camp,
        as: 'camps',
        through: { attributes: [] },
        // where: { status: 'active' },
        attributes: { exclude: ['clinicId', 'updatedAt'] },
      },
    ],
    order: [['createdAt', 'DESC']], // Sort by creation date (latest first)
  });

  // Return the list of users
  return users;
};

/**
 * Update user by id
 * @param {ObjectId} userId
 * @param {Object} updateBody
 * @returns {Promise<User>}
 */
const updateUserById = async (userId, updateBody) => {
  const user = await getUserById(userId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }
  if (updateBody.email && (await User.isEmailTaken(updateBody.email, userId))) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Email already taken');
  }
  await user.update(updateBody);
  return user;
};

/**
 * Update user details
 * @param {String} userId - ID of the user
 * @param {Object} updateBody - Updated data
 * @returns {Promise<User>}
 */
const updateUser = async (userId, updateBody) => {
  const { roles, specialties, ...userDetails } = updateBody;

  // Fetch the user
  const user = await User.findByPk(userId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }

  // Update user basic details
  if (Object.keys(userDetails).length > 0) {
    await user.update(userDetails);
  }

  // Update roles
  if (roles) {
    // Fetch existing role IDs
    const existingRoles = await user.getRoles({ attributes: ['id'] });
    const existingRoleIds = existingRoles.map((role) => role.id);

    // Determine roles to add and remove
    const rolesToAdd = roles.filter((roleId) => !existingRoleIds.includes(roleId));
    const rolesToRemove = existingRoleIds.filter((roleId) => !roles.includes(roleId));

    // Add new roles
    if (rolesToAdd.length > 0) {
      const rolesToAddInstances = await Role.findAll({
        where: { id: rolesToAdd },
      });
      await user.addRoles(rolesToAddInstances);
    }

    // Remove old roles
    if (rolesToRemove.length > 0) {
      const rolesToRemoveInstances = await Role.findAll({
        where: { id: rolesToRemove },
      });
      await user.removeRoles(rolesToRemoveInstances);
    }
  }

  // Update specialties
  if (specialties) {
    // Fetch existing specialty IDs
    const existingSpecialties = await user.getSpecialties({ attributes: ['id'] });
    const existingSpecialtyIds = existingSpecialties.map((specialty) => specialty.id);

    // Determine specialties to add and remove
    const specialtiesToAdd = specialties.filter((specialtyId) => !existingSpecialtyIds.includes(specialtyId));
    const specialtiesToRemove = existingSpecialtyIds.filter((specialtyId) => !specialties.includes(specialtyId));

    // Add new specialties
    if (specialtiesToAdd.length > 0) {
      const specialtiesToAddInstances = await Specialty.findAll({
        where: { id: specialtiesToAdd },
      });
      await user.addSpecialties(specialtiesToAddInstances);
    }

    // Remove old specialties
    if (specialtiesToRemove.length > 0) {
      const specialtiesToRemoveInstances = await Specialty.findAll({
        where: { id: specialtiesToRemove },
      });
      await user.removeSpecialties(specialtiesToRemoveInstances);
    }
  }

  // Fetch updated user with roles and specialties
  const updatedUser = await User.findByPk(userId, {
    include: [
      { model: Role, as: 'roles', attributes: ['id', 'roleName'] },
      { model: Specialty, as: 'specialties', attributes: ['id', 'name', 'departmentName'] },
    ],
  });

  return updatedUser;
};

/**
 * Delete user by id
 * @param {ObjectId} userId
 * @returns {Promise<User>}
 */
const deleteUserById = async (userId) => {
  const user = await getUserById(userId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }
  await user.destroy({ force: true });
  // return user;
};

module.exports = {
  createUser,
  getUserById,
  getUserByEmail,
  getUsersByClinic,
  updateUserById,
  updateUser,
  deleteUserById,
  getUserAssociatedToClinic,
};
