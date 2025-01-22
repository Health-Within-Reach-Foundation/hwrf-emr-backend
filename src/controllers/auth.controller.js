const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const { authService, tokenService, emailService, clinicService, userService } = require('../services');
const { tokenTypes } = require('../config/tokens');
const { sendEmail } = require('../services/email.service');
const sendEmailAzure = require('../services/email.azure.service');

const register = catchAsync(async (req, res) => {
  // invoke register service
  const { name, email, role, phoneNumber } = req.body;
  const user = await authService.register({ name, email, phoneNumber, password: 'TzR6!wS@7bH9', role });
  // const user = await userService.createUser({ name, email, phoneNumber, password: 'TzR6!wS@7bH9', });

  const setPasswordToken = await tokenService.generatePasswordToken(user.email, tokenTypes.SET_PASSWORD);

  await emailService.sendPasswordEmail(user.email, setPasswordToken, tokenTypes.SET_PASSWORD);

  // Send response
  res.status(httpStatus.NO_CONTENT).json({
    success: true,
    message: `Hi ! ${user.name}, A link to set your password has been sent to your email. Please check your inbox and follow the instructions`,
    data: null,
  });
});

const onboardClinic = catchAsync(async (req, res) => {
  // Invoke service to handle clinic and admin creation
  const { clinic, admin } = await clinicService.onboardClinicNew(req.body);

  // console.log(clin)

  const subject = 'Thank You for Onboarding with HWRF!';
  const text = `Thank you for filling out the onboarding form and expressing interest in joining HWRF. We are thrilled to have you onboard!
  
We wanted to let you know that your submission is currently under review. Once the review process is complete, your request will be approved, and you'll receive an email with the next steps.

Thank you!

Best regards,
The HWRF Team`;

  await sendEmailAzure(admin.email, subject, text);
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
  await authService.logout(req.body.refreshToken, req.user.id);

  res.status(httpStatus.NO_CONTENT).send();
});

const refreshTokens = catchAsync(async (req, res) => {
  const tokens = await authService.refreshAuth(req.body.refreshToken, req.body.accessToken);
  res.status(200).send({ tokens });
});

const forgotPassword = catchAsync(async (req, res) => {
  const resetPasswordToken = await tokenService.generatePasswordToken(req.body.email, tokenTypes.SET_PASSWORD);
  await emailService.sendPasswordEmail(req.body.email, resetPasswordToken, tokenTypes.RESET_PASSWORD);
  res.status(httpStatus.OK).json({
    success: true,
    message: `A password reset link has been sent to your ${req.body.email}. Please check your inbox to set a new password.`,
    data: null, // No additional data is required for this operation
  });
});

const resetPassword = catchAsync(async (req, res) => {
  await authService.resetPassword(req.query.token, req.body.password);
  res.status(httpStatus.OK).json({
    success: true,
    message: 'Your password set Successfully !',
    data: null,
  });
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
