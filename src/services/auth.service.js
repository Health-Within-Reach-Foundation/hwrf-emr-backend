const httpStatus = require('http-status');
const tokenService = require('./token.service');
const userService = require('./user.service');
const { Token } = require('../models/token.model');
const ApiError = require('../utils/ApiError');
const { tokenTypes } = require('../config/tokens');
const { User } = require('../models/user.model');
const { Role } = require('../models/role.model');
const { Clinic } = require('../models/clinic.model');
const { sendClinicOnboardingNotification } = require('./email.service');
const logger = require('../config/logger');

/**
 * Login with username and password
 * @param {string} email
 * @param {string} password
 * @returns {Promise<User>}
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
 * Logout
 * @param {string} refreshToken
 * @returns {Promise}
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
 * Refresh auth tokens
 * @param {string} refreshToken
 * @returns {Promise<Object>}
 */
const refreshAuth = async (refreshToken, accessToken) => {
  try {
    //single renewal of access token after
    const accessTokenDocValidity = await tokenService.verifyAccessToken(accessToken);
    const refreshTokenDoc = await tokenService.verifyToken(refreshToken, tokenTypes.REFRESH);
    if (accessTokenDocValidity && refreshTokenDoc) {
      console.group('*Expired access so creating a new access token only as refresh token is still valid');
      const user = await userService.getUserById(refreshTokenDoc.userId);
      if (!user) {
        throw new Error();
      }
      const res = await tokenService.generateAccessTokenOnly(user, refreshToken);
      return res;
    } else {
      const refreshTokenDoc = await tokenService.verifyToken(refreshToken, tokenTypes.REFRESH);
      console.group('*Expired refresh token');
      const user = await userService.getUserById(refreshTokenDoc.userId);
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
 * Reset password
 * @param {string} resetPasswordToken
 * @param {string} newPassword
 * @returns {Promise}
 */
const resetPassword = async (resetPasswordToken, newPassword) => {
  console.log('resetpasswordToken -->', resetPasswordToken);
  try {
    console.log('hello -->');
    const resetPasswordTokenDoc = await tokenService.verifyToken(resetPasswordToken, tokenTypes.SET_PASSWORD);
    console.log('verifed reset token --> ', resetPasswordTokenDoc);
    const user = await userService.getUserById(resetPasswordTokenDoc.userId);
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
 * Verify email
 * @param {string} verifyEmailToken
 * @returns {Promise}
 */
const verifyEmail = async (verifyEmailToken) => {
  try {
    const verifyEmailTokenDoc = await tokenService.verifyToken(verifyEmailToken, tokenTypes.VERIFY_EMAIL);
    const user = await userService.getUserById(verifyEmailTokenDoc.user);
    if (!user) {
      throw new Error();
    }
    await Token.deleteMany({ user: user.id, type: tokenTypes.VERIFY_EMAIL });
    await userService.updateUserById(user.id, { isEmailVerified: true });
  } catch (error) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Email verification failed');
  }
};

const register = async (userBody) => {
  const { name, email, password, role, phoneNumber } = userBody;
  if (await User.isEmailTaken(userBody.email)) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Email already taken');
  }
  const superadmin = await User.create({
    name,
    email,
    password,
    phoneNumber,
  });
  const superadminRole = await Role.create({ roleName: role, userId: superadmin.id });

  // Associate the superadmin with the role using the automatically created junction table
  await superadmin.addRole(superadminRole);

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
