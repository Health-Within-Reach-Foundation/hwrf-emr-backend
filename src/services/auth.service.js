const httpStatus = require('http-status');
const tokenService = require('./token.service');
const userService = require('./user.service');
const { Token } = require('../models/token.model');
const ApiError = require('../utils/ApiError');
const { tokenTypes } = require('../config/tokens');
const { User } = require('../models/user.model');
const { Role } = require('../models/role.model');
const logger = require('../config/logger');

/**
 * Logs in a user using their email and password.
 *
 * @param {string} email - The email of the user.
 * @param {string} password - The password of the user.
 * @returns {Promise<Object>} The user object without the password.
 * @throws {ApiError} If the email or password is incorrect.
 */
const loginUserWithEmailAndPassword = async (email, password) => {
  const user = await userService.getUserByEmail(email);
  if (!user || !(await user.isPasswordMatch(password))) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Incorrect email or password');
  }
  const userWithoutPassword = user.get({ plain: true });
  delete userWithoutPassword.password; // Manually delete password

  return userWithoutPassword;
};

/**
 * Logs out a user by invalidating their refresh token and updating their current campaign ID.
 *
 * @param {string} refreshToken - The refresh token to be invalidated.
 * @param {string} userId - The ID of the user to be logged out.
 * @throws {ApiError} If the refresh token is not found.
 * @returns {Promise<void>} A promise that resolves when the logout process is complete.
 */
const logout = async (refreshToken, userId) => {
  console.log('refresh token -->', refreshToken, userId);
  const refreshTokenDoc = await Token.findOne({
    where: { token: refreshToken, type: tokenTypes.REFRESH, blacklisted: false },
  });
  await User.update({ currentCampId: null }, { where: { id: userId } });

  if (!refreshTokenDoc) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Not found');
  }
  await refreshTokenDoc.destroy({ force: true });
};

/**
 * Refreshes the authentication tokens.
 *
 * @param {string} refreshToken - The refresh token used to obtain a new access token.
 * @param {string} accessToken - The current access token to be verified.
 * @returns {Promise<Object>} An object containing the new access token and refresh token, or null tokens if the refresh token is invalid.
 * @throws {Error} If the user associated with the refresh token is not found.
 */
const refreshAuth = async (refreshToken, accessToken) => {
  try {
    //single renewal of access token after
    const accessTokenDocValidity = await tokenService.verifyAccessToken(accessToken);
    const refreshTokenDoc = await tokenService.verifyToken(refreshToken, tokenTypes.REFRESH);
    if (accessTokenDocValidity && refreshTokenDoc) {
      console.group('*Expired access so creating a new access token only as refresh token is still valid');
      const user = await userService.getSimpleUserById(refreshTokenDoc.userId);
      if (!user) {
        throw new Error();
      }
      const res = await tokenService.generateAccessTokenOnly(user, refreshToken);
      return res;
    } else {
      const refreshTokenDoc = await tokenService.verifyToken(refreshToken, tokenTypes.REFRESH);
      console.group('*Expired refresh token');
      const user = await userService.getSimpleUserById(refreshTokenDoc.userId);
      user.currentCampId = null;
      await user.save();
      await refreshTokenDoc.destroy({ force: true });
      // const res = await tokenService.generateAuthTokens(user);
      return { access: { token: null }, refresh: { token: null } };
    }
  } catch (error) {
    console.error('error in auth service line 65: ', error);
    // throw new ApiError(httpStatus.UNAUTHORIZED, 'Please authenticate');
    return { access: { token: null }, refresh: { token: null } };
  }
};

/**
 * Resets the user's password using the provided reset password token and new password.
 *
 * @param {string} resetPasswordToken - The token used to verify the password reset request.
 * @param {string} newPassword - The new password to set for the user.
 * @throws {ApiError} If the password reset fails.
 * @returns {Promise<void>} A promise that resolves when the password has been successfully reset.
 */
const resetPassword = async (resetPasswordToken, newPassword) => {
  console.log('resetpasswordToken -->', resetPasswordToken);
  try {
    console.log('hello -->');
    const resetPasswordTokenDoc = await tokenService.verifyToken(resetPasswordToken, tokenTypes.SET_PASSWORD);
    console.log('verifed reset token --> ', resetPasswordTokenDoc);
    const user = await userService.getSimpleUserById(resetPasswordTokenDoc.userId);
    if (!user) {
      throw new Error();
    }
    console.log('FILE: authService --> reset password destroyed');
    await userService.updateUserById(user.id, { password: newPassword, status: 'active' });
    await Token.destroy({ where: { userId: user.id, type: tokenTypes.SET_PASSWORD }, force: true });
  } catch (error) {
    logger.error(error);
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Password reset failed');
  }
};

/**
 * Verify the email using the provided token.
 *
 * @param {string} verifyEmailToken - The token used to verify the email.
 * @returns {Promise<void>} - A promise that resolves when the email is successfully verified.
 * @throws {ApiError} - Throws an error if the email verification fails.
 */
const verifyEmail = async (verifyEmailToken) => {
  try {
    const verifyEmailTokenDoc = await tokenService.verifyToken(verifyEmailToken, tokenTypes.VERIFY_EMAIL);
    const user = await userService.getSimpleUserById(verifyEmailTokenDoc.user);
    if (!user) {
      throw new Error();
    }
    await Token.deleteMany({ user: user.id, type: tokenTypes.VERIFY_EMAIL });
    await userService.updateUserById(user.id, { isEmailVerified: true });
  } catch (error) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Email verification failed');
  }
};

/**
 * Registers a new user.
 *
 * @param {Object} userBody - The user details.
 * @param {string} userBody.name - The name of the user.
 * @param {string} userBody.email - The email of the user.
 * @param {string} userBody.password - The password of the user.
 * @param {string} userBody.role - The role of the user.
 * @param {string} userBody.phoneNumber - The phone number of the user.
 * @returns {Promise<Object>} The created user.
 * @throws {ApiError} If the email is already taken.
 */
const register = async (userBody, transaction = null) => {
  const { name, email, password, role, phoneNumber } = userBody;
  if (await User.isEmailTaken(userBody.email)) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Email already taken');
  }
  const superadmin = await User.create(
    {
      name,
      email,
      password,
      phoneNumber,
    },
    { transaction }
  );
  const superadminRole = await Role.create(
    {
      roleName: role,
      userId: superadmin.id,
    },
    { transaction }
  );

  // Associate the superadmin with the role using the automatically created junction table
  await superadmin.addRole(superadminRole, { transaction });

  return superadmin;
};

module.exports = {
  loginUserWithEmailAndPassword,
  logout,
  refreshAuth,
  resetPassword,
  verifyEmail,
  register,
};
