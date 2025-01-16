const httpStatus = require('http-status');
const pick = require('../utils/pick');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const { userService, tokenService, emailService } = require('../services');
const { tokenTypes } = require('../config/tokens');
const { createRole } = require('../services/role.service');
const { Specialty } = require('../models/specialty.model');

const createUser = catchAsync(async (req, res) => {
  const user = await userService.createUser(req.body);
  res.status(httpStatus.CREATED).send(user);
});

const createClinicUser = catchAsync(async (req, res) => {
  // Destructure 'role' and exclude it from userPayload, but keep it in req.body
  const { roles, specialities, ...userPayload } = {
    ...req.body, // Spread existing req.body
    clinicId: req.user.clinicId, // Attach clinicId
    password: 'TzR6!wS@7bH9',
  };

  // Create the user
  const user = await userService.createUser(userPayload);
  // user.addSpecialties({specialtyId: re});
  if (specialities && specialities.length > 0) {
    // 'addSpecialties' automatically inserts entries in 'user_specialties'
    await user.addSpecialties(specialities); // Pass array of specialty IDs
  }

  user.addRoles(roles);

  // await createRole({ roleName: role, userId: user.id, clinicId: req.user.clinicId }, user);

  // Generate the set-password token
  const setPasswordToken = await tokenService.generatePasswordToken(user.email, tokenTypes.SET_PASSWORD);

  // Send the set-password email
  await emailService.sendPasswordEmail(user.email, setPasswordToken, tokenTypes.SET_PASSWORD);

  // Respond with no content (204 status code)
  return res.status(httpStatus.NO_CONTENT).send();
});

const getUserById = catchAsync(async (req, res) => {
  const { userId } = req.params;

  const userDetails = await userService.getUserById(userId);

  res.status(httpStatus.OK).json({
    success: true,
    message: 'User details fetched successfully',
    data: userDetails,
  });
});

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

const deleteUser = catchAsync(async (req, res) => {
  await userService.deleteUserById(req.params.userId);
  res.status(httpStatus.NO_CONTENT).send();
});

module.exports = {
  createUser,
  getUserById,
  updateUser,
  deleteUser,
  createClinicUser,
};
