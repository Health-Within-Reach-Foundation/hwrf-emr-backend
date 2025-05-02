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
const createUser = async (userBody, transaction = null) => {
  if (await User.isEmailTaken(userBody.email)) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Email already taken');
  }

  return User.create(userBody, { transaction });
  // return User.create(userBody);
};

/**
 * Get user by id
 * @param {string} id
 * @returns {Promise<User>}
 */
const getUserById = async (id) => {
  const user = User.findByPk(id, {
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
  return user;
};

// const getUserById = async (id) => {
//   try {
//     // Fetch user details with minimal data
//     const user = await User.findByPk(id);

//     if (!user) {
//       return null; // Or handle error case
//     }

//     // Fetch related roles and permissions separately
//     const roles = await user.getRoles({
//       include: [
//         {
//           as: 'permissions',
//           model: Permission,
//           attributes: ['id', 'action'],
//         },
//       ],
//       attributes: { exclude: ['createdAt', 'updatedAt', 'userId', 'clinicId'] },
//     });

//     user.roles = roles;

//     // Fetch associated clinic data
//     const clinic = await user.getClinic({
//       attributes: ['id', 'clinicName', 'status'],
//     });
//     user.clinic = clinic;

//     // Fetch associated specialties
//     const specialties = await user.getSpecialties({
//       attributes: ['id', 'name', 'departmentName'],
//     });
//     user.specialties = specialties;

//     // Fetch active camps associated with the user
//     const camps = await user.getCamps({
//       attributes: { exclude: ['clinicId', 'updatedAt'] },
//       where: { status: 'active' },
//     });
//     user.camps = camps;

//     return user;
//   } catch (error) {
//     console.error('Error in getUserById:', error);
//     throw error; // Handle error at a higher level
//   }
// };

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

/**
 * Retrieves a user associated with a clinic based on the provided email.
 *
 * @param {string} userEmail - The email of the user to retrieve.
 * @returns {Promise<{user: Object, isSuperAdmin: boolean}>} - A promise that resolves to an object containing the user and a boolean indicating if the user is a superadmin.
 * @throws {ApiError} - Throws an error if the user is not found or if the user has no associated clinic and is not a superadmin.
 */
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

  console.log('getUserAssociatedToClinic -->', user);
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
    attributes: ['id', 'name', 'email', 'phoneNumber', 'specialist', 'status', 'createdAt', 'updatedAt'], // Select required fields
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
 * Get simple user by id
 * @param {string} id
 * @returns {Promise<User>}
 */
const getSimpleUserById = async (id) => {
  const user = await User.findByPk(id, {});
  return user;
};

/**
 * Get simple user by email
 * @param {string} email
 * @returns {Promise<User>}
 */

const getSimpleUserByEmail = async (email) => {
  const user = await User.findOne({
    where: { email },
  });
  return user;
};

/**
 * Update user by id
 * @param {string} userId
 * @param {Object} updateBody
 * @returns {Promise<User>}
 */
const updateUserById = async (userId, updateBody) => {
  const user = await getSimpleUserById(userId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }
  if (updateBody.email && (await User.isEmailTaken(updateBody.email, userId))) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Email already taken');
  }
  await user.update(updateBody);
  return user;
};

// TODO: Go through this function and refactor it
/**
 * Update user details
 * @param {String} userId - ID of the user
 * @param {Object} updateBody - Updated data
 * @returns {Promise<User>}
 */
const updateUser = async (userId, updateBody, transaction = null) => {
  const { roles, specialties, ...userDetails } = updateBody;

  // Fetch the user
  const user = await User.findByPk(userId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }

  // Update user basic details
  if (Object.keys(userDetails).length > 0) {
    await user.update(userDetails, { transaction });
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
      await user.addRoles(rolesToAddInstances, { transaction });
    }

    // Remove old roles
    if (rolesToRemove.length > 0) {
      const rolesToRemoveInstances = await Role.findAll({
        where: { id: rolesToRemove },
      });
      await user.removeRoles(rolesToRemoveInstances, { transaction });
    }
  }

  if (specialties === null) {
    await user.setSpecialties([], { transaction });
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
      await user.addSpecialties(specialtiesToAddInstances, { transaction });
    }

    // Remove old specialties
    if (specialtiesToRemove.length > 0) {
      const specialtiesToRemoveInstances = await Specialty.findAll({
        where: { id: specialtiesToRemove },
      });
      await user.removeSpecialties(specialtiesToRemoveInstances, { transaction });
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
 * @param {string} userId
 * @returns {Promise<User>}
 */
const deleteUserById = async (userId) => {
  const user = await getSimpleUserById(userId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }

  // Remove user from many-to-many relationships
  await user.setRoles([]);
  await user.setCamps([]);
  await user.setSpecialties([]);

  // Soft delete the user
  await user.destroy({ force: false });

  return user;
};

module.exports = {
  createUser,
  getUserById,
  getUserByEmail,
  getUsersByClinic,
  getSimpleUserById,
  getSimpleUserByEmail,
  updateUserById,
  updateUser,
  deleteUserById,
  getUserAssociatedToClinic,
};
