const httpStatus = require('http-status');
const pick = require('../utils/pick');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const { userService, tokenService, emailService, rolePermissionService } = require('../services');
const { tokenTypes } = require('../config/tokens');
const { createRole } = require('../services/role.service');
const { Specialty } = require('../models/specialty.model');

/**
 * Create a new user.
 *
 * @param {Object} req - Express request object.
 * @param {Object} req.body - The request body containing user data.
 * @param {Object} res - Express response object.
 * @returns {Promise<void>} - A promise that resolves when the user is created and the response is sent.
 */
const createUser = catchAsync(async (req, res) => {
  const user = await userService.createUser(req.body);
  res.status(httpStatus.CREATED).send(user);
});

/**
 * Creates a new clinic user.
 *
 * This function handles the creation of a new user for a clinic. It extracts the roles and specialities from the request body,
 * attaches the clinicId from the authenticated user, and sets a default password. It then creates the user, assigns any specified
 * specialities and roles, generates a set-password token, sends a set-password email, and responds with a 204 status code.
 *
 * @param {Object} req - The request object.
 * @param {Object} req.body - The request body containing user details.
 * @param {Array} req.body.roles - The roles to be assigned to the user.
 * @param {Array} req.body.specialities - The specialities to be assigned to the user.
 * @param {Object} req.user - The authenticated user object.
 * @param {string} req.user.clinicId - The clinic ID of the authenticated user.
 * @param {Object} res - The response object.
 *
 * @returns {Promise<void>} - A promise that resolves when the user is created and the response is sent.
 */
const createClinicUser = catchAsync(async (req, res) => {
  // Destructure 'role' and exclude it from userPayload, but keep it in req.body
  const { roles, specialties, ...userPayload } = {
    ...req.body, // Spread existing req.body
    clinicId: req.user.clinicId, // Attach clinicId
    password: 'TzR6!wS@7bH9',
  };

  const user = await userService.createUser(userPayload);

  if (specialties !== null && specialties.length > 0) {
    // 'addSpecialties' automatically inserts entries in 'user_specialties'
    await user.addSpecialties(specialties); // Pass array of specialty IDs
  }

  user.addRoles(roles);

  // await createRole({ roleName: role, userId: user.id, clinicId: req.user.clinicId }, user);

  // Generate the set-password token
  const setPasswordToken = await tokenService.generatePasswordToken(user.email, tokenTypes.SET_PASSWORD);

  console.log('set password token generated -->', setPasswordToken);
  // Send the set-password email
  await emailService.sendPasswordEmail(user.email, setPasswordToken, tokenTypes.SET_PASSWORD);

  // Respond with no content (204 status code)
  return res.status(httpStatus.NO_CONTENT).send();
});

/**
 * Get user details by user ID.
 *
 * @param {Object} req - Express request object.
 * @param {Object} req.params - Request parameters.
 * @param {string} req.params.userId - ID of the user to fetch.
 * @param {Object} res - Express response object.
 * @returns {Promise<void>} - A promise that resolves when the user details are fetched and the response is sent.
 */
const getUserById = catchAsync(async (req, res) => {
  const { userId } = req.params;

  const userDetails = await userService.getUserById(userId);

  res.status(httpStatus.OK).json({
    success: true,
    message: 'User details fetched successfully',
    data: userDetails,
  });
});

/**
 * Update an existing user.
 *
 * @param {Object} req - Express request object.
 * @param {Object} req.params - Request parameters.
 * @param {string} req.params.userId - ID of the user to update.
 * @param {Object} req.body - Request body containing the update data.
 * @param {Object} res - Express response object.
 * @returns {Promise<void>} - Returns a promise that resolves to void.
 */
const updateUser = catchAsync(async (req, res) => {
  const { userId } = req.params;
  const updateBody = req.body;

  const updatedUser = await userService.updateUser(userId, updateBody);

  res.status(httpStatus.OK).json({
    success: true,
    message: 'User updated successfully',
    data: updatedUser,
  });
});

/**
 * Delete a user by ID.
 *
 * @param {Object} req - Express request object.
 * @param {Object} req.params - Request parameters.
 * @param {string} req.params.userId - ID of the user to delete.
 * @param {Object} res - Express response object.
 * @returns {Promise<void>} - A promise that resolves when the user is deleted.
 */
const deleteUser = catchAsync(async (req, res) => {
  await userService.deleteUserById(req.params.userId);

  res.status(httpStatus.OK).json({
    success: true,
    message: 'User deleted! ',
  });
});

module.exports = {
  createUser,
  getUserById,
  updateUser,
  deleteUser,
  createClinicUser,
};
