const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const { authService, tokenService, emailService, clinicService, userService } = require('../services');
const { tokenTypes } = require('../config/tokens');
const { sendEmail } = require('../services/email.service');
const sendEmailAzure = require('../services/email.azure.service');

/**
 * Registers a new user and sends a password setup email.
 *
 * @param {Object} req - The request object.
 * @param {Object} req.body - The body of the request.
 * @param {string} req.body.name - The name of the user.
 * @param {string} req.body.email - The email of the user.
 * @param {string} req.body.role - The role of the user.
 * @param {string} req.body.phoneNumber - The phone number of the user.
 * @param {Object} res - The response object.
 * @returns {Promise<void>} - A promise that resolves when the registration process is complete.
 */
const register = catchAsync(async (req, res) => {
  const { name, email, role, phoneNumber } = req.body;
  const user = await authService.register({ name, email, phoneNumber, password: 'TzR6!wS@7bH9', role });

  const setPasswordToken = await tokenService.generatePasswordToken(user.email, tokenTypes.SET_PASSWORD);

  await emailService.sendPasswordEmail(user.email, setPasswordToken, tokenTypes.SET_PASSWORD);

  res.status(httpStatus.NO_CONTENT).json({
    success: true,
    message: `Hi ! ${user.name}, A link to set your password has been sent to your email. Please check your inbox and follow the instructions`,
    data: null,
  });
});

/**
 * Handles the onboarding of a new clinic and sends a confirmation email to the admin.
 *
 * @param {Object} req - The request object.
 * @param {Object} req.body - The body of the request containing clinic and admin details.
 * @param {Object} res - The response object.
 *
 * @returns {Promise<void>} - A promise that resolves when the onboarding process is complete.
 *
 * @throws {Error} - Throws an error if the onboarding process fails.
 */
const onboardClinic = catchAsync(async (req, res) => {
  const { clinic, admin } = await clinicService.onboardClinic(req.body);

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

/**
 * Login a user with email and password.
 *
 * @param {Object} req - Express request object
 * @param {Object} req.body - Request body
 * @param {string} req.body.email - User's email
 * @param {string} req.body.password - User's password
 * @param {Object} res - Express response object
 * @returns {Promise<void>} - Returns a promise that resolves to void
 */
const login = catchAsync(async (req, res) => {
  const { email, password } = req.body;
  const user = await authService.loginUserWithEmailAndPassword(email, password);
  const tokens = await tokenService.generateAuthTokens(user);

  res.send({ user, tokens });
});

/**
 * Logout a user by invalidating the refresh token.
 *
 * @param {Object} req - Express request object.
 * @param {Object} req.body - Request body.
 * @param {string} req.body.refreshToken - The refresh token to be invalidated.
 * @param {Object} req.user - Authenticated user object.
 * @param {string} req.user.id - ID of the authenticated user.
 * @param {Object} res - Express response object.
 * @returns {Promise<void>} - A promise that resolves when the logout process is complete.
 */
const logout = catchAsync(async (req, res) => {
  await authService.logout(req.body.refreshToken, req.user.id);

  res.status(httpStatus.NO_CONTENT).send();
});

/**
 * Refreshes authentication tokens.
 *
 * @param {Object} req - The request object.
 * @param {Object} req.body - The body of the request.
 * @param {string} req.body.refreshToken - The refresh token.
 * @param {string} req.body.accessToken - The access token.
 * @param {Object} res - The response object.
 * @returns {Promise<void>} - A promise that resolves when the tokens are refreshed and sent in the response.
 */
const refreshTokens = catchAsync(async (req, res) => {
  const tokens = await authService.refreshAuth(req.body.refreshToken, req.body.accessToken);
  res.status(200).send({ tokens });
});

/**
 * Handles the forgot password request.
 * Generates a password reset token and sends a reset email to the user.
 *
 * @param {Object} req - Express request object
 * @param {Object} req.body - Request body
 * @param {string} req.body.email - User's email address
 * @param {Object} res - Express response object
 * @returns {Promise<void>} - Sends a JSON response with success message
 */
const forgotPassword = catchAsync(async (req, res) => {
  const resetPasswordToken = await tokenService.generatePasswordToken(req.body.email, tokenTypes.SET_PASSWORD);
  await emailService.sendPasswordEmail(req.body.email, resetPasswordToken, tokenTypes.RESET_PASSWORD);
  res.status(httpStatus.OK).json({
    success: true,
    message: `A password reset link has been sent to your ${req.body.email}. Please check your inbox to set a new password.`,
    data: null, // No additional data is required for this operation
  });
});

/**
 * Reset the user's password.
 *
 * @param {Object} req - Express request object.
 * @param {Object} req.query - Query parameters.
 * @param {string} req.query.token - Password reset token.
 * @param {Object} req.body - Request body.
 * @param {string} req.body.password - New password.
 * @param {Object} res - Express response object.
 * @returns {Promise<void>} - A promise that resolves when the password has been reset.
 */
const resetPassword = catchAsync(async (req, res) => {
  await authService.resetPassword(req.query.token, req.body.password);
  res.status(httpStatus.OK).json({
    success: true,
    message: 'Your password set Successfully !',
    data: null,
  });
});

/**
 * Sends a verification email to the user.
 *
 * This function generates a verification email token for the user and sends a verification email to the user's email address.
 * It responds with a 204 No Content status upon successful completion.
 *
 * @param {Object} req - The request object.
 * @param {Object} req.user - The user object containing user details.
 * @param {Object} req.user.email - The email address of the user.
 * @param {Object} res - The response object.
 * @returns {Promise<void>} - A promise that resolves when the email has been sent and the response has been sent.
 */
const sendVerificationEmail = catchAsync(async (req, res) => {
  const verifyEmailToken = await tokenService.generateVerifyEmailToken(req.user);
  await emailService.sendVerificationEmail(req.user.email, verifyEmailToken);
  res.status(httpStatus.NO_CONTENT).send();
});

/**
 * Verifies the user's email using the token provided in the query parameters.
 * 
 * @param {Object} req - Express request object.
 * @param {Object} req.query - Query parameters of the request.
 * @param {string} req.query.token - Token for email verification.
 * @param {Object} res - Express response object.
 * @returns {Promise<void>} - A promise that resolves when the email is verified.
 */
const verifyEmail = catchAsync(async (req, res) => {
  await authService.verifyEmail(req.query.token);
  res.status(httpStatus.NO_CONTENT).send();
});

/**
 * Get the authenticated user's details.
 *
 * This function is an asynchronous handler that retrieves the details of the currently authenticated user.
 * It uses the userService to fetch the user data based on the user ID present in the request object.
 * The response is sent back with a status of 200 (OK) and includes the user data in JSON format.
 *
 * @param {Object} req - The request object.
 * @param {Object} req.user - The authenticated user's data.
 * @param {string} req.user.id - The ID of the authenticated user.
 * @param {Object} res - The response object.
 * @returns {Promise<void>} - A promise that resolves when the response is sent.
 */
const getMe = catchAsync(async (req, res) => {
  console.log('Req from getMe function --> ', req.user.specialties);
  const user = await userService.getUserById(req.user.id); // Use service to fetch user data

  res.status(httpStatus.OK).json({
    success: true,
    user,
  });
});


/**
 * Verifies the provided token and returns user details if the token is valid.
 * 
 * @param {Object} req - The request object.
 * @param {Object} req.query - The query parameters of the request.
 * @param {string} req.query.token - The token to be verified.
 * @param {Object} res - The response object.
 * @returns {Promise<void>} - A promise that resolves when the response is sent.
 */
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
