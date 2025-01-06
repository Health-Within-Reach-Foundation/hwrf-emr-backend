const httpStatus = require('http-status');
const pick = require('../utils/pick');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const { userService, tokenService, emailService } = require('../services');
const { tokenTypes } = require('../config/tokens');
const { createRole } = require('../services/role.service');

const createUser = catchAsync(async (req, res) => {
  const user = await userService.createUser(req.body);
  res.status(httpStatus.CREATED).send(user);
});

const createClinicUser = catchAsync(async (req, res) => {
  // Destructure 'role' and exclude it from userPayload, but keep it in req.body
  const { role, ...userPayload } = {
    ...req.body, // Spread existing req.body
    clinicId: req.user.clinicId, // Attach clinicId
    password: 'TzR6!wS@7bH9',
  };

  // Create the user
  const user = await userService.createUser(userPayload);

  await createRole({ roleName: role, userId: user.id, clinicId: req.user.clinicId }, user);
  // Generate the set-password token
  const setPasswordToken = await tokenService.generatePasswordToken(user.email, tokenTypes.SET_PASSWORD);

  // Send the set-password email
  await emailService.sendPasswordEmail(user.email, setPasswordToken, tokenTypes.SET_PASSWORD);

  // Respond with no content (204 status code)
  return res.status(httpStatus.NO_CONTENT).send();
});

const getUsers = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['name', 'role']);
  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  const result = await userService.queryUsers(filter, options);
  res.send(result);
});

const getUser = catchAsync(async (req, res) => {
  const user = await userService.getUserById(req.params.userId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }
  res.send(user);
});

const updateUser = catchAsync(async (req, res) => {
  const user = await userService.updateUserById(req.params.userId, req.body);
  res.send(user);
});

const deleteUser = catchAsync(async (req, res) => {
  await userService.deleteUserById(req.params.userId);
  res.status(httpStatus.NO_CONTENT).send();
});

module.exports = {
  createUser,
  getUsers,
  getUser,
  updateUser,
  deleteUser,
  createClinicUser,
};
