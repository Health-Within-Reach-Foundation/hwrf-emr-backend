const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const { authService, tokenService, emailService, clinicService, userService } = require('../services');
const { tokenTypes } = require('../config/tokens');

const register = catchAsync(async (req, res) => {
  // invoke register service
  const user = await authService.register(req.body);

  // Send response
  res.status(httpStatus.CREATED).json({
    success: true,
    message: 'User registered successfully',
    data: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  });
});

const onboardClinic = catchAsync(async (req, res) => {
  // Invoke service to handle clinic and admin creation
  const { clinic, admin } = await clinicService.onboardClinic(req.body);

  // Send response
  res.status(httpStatus.CREATED).json({
    success: true,
    message: "Request sent. Awaiting superadmin approval. You'll receive an email reply soon",
    data: {
      clinic_id: clinic.id,
      admin_id: admin.id,
    },
  });
});

const login = catchAsync(async (req, res) => {
  const { email, password } = req.body;
  const user = await authService.loginUserWithEmailAndPassword(email, password);
  const tokens = await tokenService.generateAuthTokens(user);
  
  res.send({ user, tokens });
});

const logout = catchAsync(async (req, res) => {
  await authService.logout(req.body.refreshToken);
  res.status(httpStatus.NO_CONTENT).send();
});

const refreshTokens = catchAsync(async (req, res) => {
  const tokens = await authService.refreshAuth(req.body.refreshToken);
  res.send({ ...tokens });
});

const forgotPassword = catchAsync(async (req, res) => {
  const resetPasswordToken = await tokenService.generatePasswordToken(req.body.email, tokenTypes.SET_PASSWORD);
  await emailService.sendPasswordEmail(req.body.email, resetPasswordToken, tokenTypes.RESET_PASSWORD);
  res.status(httpStatus.NO_CONTENT).send();
});

const resetPassword = catchAsync(async (req, res) => {
  await authService.resetPassword(req.query.token, req.body.password);
  res.status(httpStatus.NO_CONTENT).send();
});

const sendVerificationEmail = catchAsync(async (req, res) => {
  const verifyEmailToken = await tokenService.generateVerifyEmailToken(req.user);
  await emailService.sendVerificationEmail(req.user.email, verifyEmailToken);
  res.status(httpStatus.NO_CONTENT).send();
});

const verifyEmail = catchAsync(async (req, res) => {
  await authService.verifyEmail(req.query.token);
  res.status(httpStatus.NO_CONTENT).send();
});

const getMe = catchAsync(async (req, res) => {
  console.log('Req from getMe function --> ', req.user.specialties);
  const user = await userService.getUserById(req.user.id); // Use service to fetch user data

  res.status(httpStatus.OK).json({
    success: true,
    user,
  });
});

// Verify Token API
const verifyToken = catchAsync(async (req, res) => {
  // const { token } = req.params;
  console.log(req.query);
  const payload = await tokenService.verifyToken(req.query.token, tokenTypes.SET_PASSWORD);
  // Return user details on successful token verification
  const user = await userService.getUserById(payload.userId);
  res.status(httpStatus.OK).json({
    success: true,
    message: 'Token verified successfully.',
    data: {
      id: user.id,
      name: user.name,
      email: user.email,
    },
  });
});

module.exports = {
  register,
  login,
  logout,
  refreshTokens,
  forgotPassword,
  resetPassword,
  sendVerificationEmail,
  verifyEmail,
  onboardClinic,
  getMe,
  verifyToken,
};
