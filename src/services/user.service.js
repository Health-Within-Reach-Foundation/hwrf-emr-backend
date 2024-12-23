const httpStatus = require('http-status');
const ApiError = require('../utils/ApiError');
const { User } = require('../models/user.model');
const { Role } = require('../models/role.model');
const { Clinic } = require('../models/clinic.model');

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
 * Query for users
 * @param {Object} filter - Mongo filter
 * @param {Object} options - Query options
 * @param {string} [options.sortBy] - Sort option in the format: sortField:(desc|asc)
 * @param {number} [options.limit] - Maximum number of results per page (default = 10)
 * @param {number} [options.page] - Current page (default = 1)
 * @returns {Promise<QueryResult>}
 */
const queryUsers = async (filter, options) => {
  const users = await User.paginate(filter, options);
  return users;
};

/**
 * Get user by id
 * @param {ObjectId} id
 * @returns {Promise<User>}
 */
const getUserById = async (id) => {
  return User.findByPk(id, {
    include: {
      model: Role,
      as: 'roles',
      through: { attributes: [] }, // Exclude intermediate table fields
      attributes: { exclude: ['createdAt', 'updatedAt', 'userId', 'clinicId'] },
    },
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
    include: {
      model: Role,
      as: 'roles',
      through: { attributes: [] }, // Exclude intermediate table fields
      attributes: { exclude: ['createdAt', 'updatedAt', 'userId', 'clinicId'] }, // Exclude role-specific fields
    },
  });
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
 * Delete user by id
 * @param {ObjectId} userId
 * @returns {Promise<User>}
 */
const deleteUserById = async (userId) => {
  const user = await getUserById(userId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }
  await user.remove();
  return user;
};

const getUserWithAssociatedClinic = async (userEmail) => {
  console.log("userid -->", userEmail);
  const user = await User.findOne({
    where: {
      email: userEmail
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
  console.log("asdfghjkl",isSuperAdmin);
  if (isSuperAdmin) {
    return { user, isSuperAdmin: true };
  }

  // If not superadmin, ensure user has a clinic associated
  if (!user.clinic) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'User has no associated clinic');
  }
  console.log("returnning user from getUserWithAssociatedClinic -->", user.clinic.status);
  return { user, isSuperAdmin: false };
};
module.exports = {
  createUser,
  queryUsers,
  getUserById,
  getUserByEmail,
  updateUserById,
  deleteUserById,
  getUserWithAssociatedClinic,
};
