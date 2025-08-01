const express = require('express');
const validate = require('../../middlewares/validate');
const authController = require('../../controllers/auth.controller');
const auth = require('../../middlewares/auth');
const { clinicValidation, authValidation } = require('../../validations');
const isClinicActive = require('../../middlewares/clinic-active');

const router = express.Router();

router.post('/register', validate(authValidation.register), authController.register);

router.route('/onboard-clinic').post(validate(clinicValidation.onboardClinic), authController.onboardClinic);

router.post('/login', validate(authValidation.login), isClinicActive, authController.login);

router.post('/logout', auth(), validate(authValidation.logout), authController.logout);

router.post('/refresh-tokens', validate(authValidation.refreshTokens), authController.refreshTokens);

router.get('/me', auth(), validate(authValidation.getMe), authController.getMe);

router.post('/forgot-password', validate(authValidation.forgotPassword), authController.forgotPassword);

router.post('/reset-password', validate(authValidation.resetPassword), authController.resetPassword);

router.post('/send-verification-email', auth(), authController.sendVerificationEmail);

router.post('/verify-email', validate(authValidation.verifyEmail), authController.verifyEmail);

router.get('/verify-token',validate(authValidation.verifyEmail), authController.verifyToken);

module.exports = router;

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentication
 */

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register as user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *                 description: must be unique
 *               password:
 *                 type: string
 *                 format: password
 *                 minLength: 8
 *                 description: At least one number and one letter
 *             example:
 *               name: fake name
 *               email: fake@example.com
 *               password: password1
 *     responses:
 *       "201":
 *         description: Created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *                 tokens:
 *                   $ref: '#/components/schemas/AuthTokens'
 *       "400":
 *         $ref: '#/components/responses/DuplicateEmail'
 */

/**
 * @swagger
 * /auth/onboard-clinic:
 *   post:
 *     summary: Onboard a clinic and create an admin account
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - clinicName
 *               - address
 *               - city
 *               - state
 *               - phoneNumber
 *               - contactEmail
 *               - specialties
 *               - adminName
 *               - adminEmail
 *               - password
 *             properties:
 *               clinicName:
 *                 type: string
 *                 description: Name of the clinic
 *               address:
 *                 type: string
 *                 description: Address of the clinic
 *               city:
 *                 type: string
 *                 description: City where the clinic is located
 *               state:
 *                 type: string
 *                 description: State where the clinic is located
 *               phoneNumber:
 *                 type: string
 *                 description: Contact number of the clinic
 *               contactEmail:
 *                 type: string
 *                 format: email
 *                 description: Email address of the clinic
 *               website:
 *                 type: string
 *                 description: Website URL of the clinic (optional)
 *               specialties:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of specialty IDs
 *                 example:
 *                   - "0449a5e1-e134-4fee-bbf6-1e68835a8eb3"
 *                   - "12345678-90ab-cdef-1234-567890abcdef"
 *               adminName:
 *                 type: string
 *                 description: Name of the clinic admin
 *               adminEmail:
 *                 type: string
 *                 format: email
 *                 description: Email address of the clinic admin
 *               adminPhoneNumber:
 *                 type: string
 *                 description: Phone number of the clinic admin
 *               password:
 *                 type: string
 *                 format: password
 *                 description: Password for the clinic admin account
 *             example:
 *               clinicName: ABC Clinic
 *               address: 123 Main St
 *               city: Metropolis
 *               state: New York
 *               phoneNumber: "1234567890"
 *               contactEmail: contact@abcclinic.com
 *               website: www.abcclinic.com
 *               specialties:
 *                 - "0449a5e1-e134-4fee-bbf6-1e68835a8eb3"
 *                 - "12345678-90ab-cdef-1234-567890abcdef"
 *               adminName: John Doe
 *               adminEmail: john.doe@abcclinic.com
 *               adminPhoneNumber: "9876543210"
 *               password: securepassword123
 *     responses:
 *       "201":
 *         description: Clinic and admin created successfully. Awaiting superadmin approval.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Success message
 *                   example: Clinic and admin created successfully. Awaiting superadmin approval.
 *                 clinic:
 *                   type: object
 *                   description: Details of the onboarded clinic
 *                   properties:
 *                     id:
 *                       type: string
 *                       description: Clinic ID
 *                     clinicName:
 *                       type: string
 *                       description: Name of the clinic
 *                     address:
 *                       type: string
 *                       description: Address of the clinic
 *                     city:
 *                       type: string
 *                       description: City where the clinic is located
 *                     state:
 *                       type: string
 *                       description: State where the clinic is located
 *                     phoneNumber:
 *                       type: string
 *                       description: Phone number of the clinic
 *                     contactEmail:
 *                       type: string
 *                       description: Contact email of the clinic
 *                     ownerId:
 *                       type: string
 *                       description: Admin ID who owns the clinic
 *                 admin:
 *                   type: object
 *                   description: Details of the clinic admin
 *                   properties:
 *                     id:
 *                       type: string
 *                       description: Admin user ID
 *                     name:
 *                       type: string
 *                       description: Name of the clinic admin
 *                     email:
 *                       type: string
 *                       description: Email address of the clinic admin
 *                     clinicId:
 *                       type: string
 *                       description: Associated clinic ID
 *       "400":
 *         description: Validation error or clinic/admin already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               code: 400
 *               message: Clinic has already been registered!
 *       "500":
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               code: 500
 *               message: An unexpected error occurred
 */

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 format: password
 *             example:
 *               email: fake@example.com
 *               password: password1
 *     responses:
 *       "200":
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *                 tokens:
 *                   $ref: '#/components/schemas/AuthTokens'
 *       "401":
 *         description: Invalid email or password
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               code: 401
 *               message: Invalid email or password
 */

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Logout
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *             example:
 *               refreshToken: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI1ZWJhYzUzNDk1NGI1NDEzOTgwNmMxMTIiLCJpYXQiOjE1ODkyOTg0ODQsImV4cCI6MTU4OTMwMDI4NH0.m1U63blB0MLej_WfB7yC2FTMnCziif9X8yzwDEfJXAg
 *     responses:
 *       "204":
 *         description: No content
 *       "404":
 *         $ref: '#/components/responses/NotFound'
 */

/**
 * @swagger
 * /auth/refresh-tokens:
 *   post:
 *     summary: Refresh auth tokens
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *             example:
 *               refreshToken: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI1ZWJhYzUzNDk1NGI1NDEzOTgwNmMxMTIiLCJpYXQiOjE1ODkyOTg0ODQsImV4cCI6MTU4OTMwMDI4NH0.m1U63blB0MLej_WfB7yC2FTMnCziif9X8yzwDEfJXAg
 *     responses:
 *       "200":
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthTokens'
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 */

/**
 * @swagger
 * /auth/forgot-password:
 *   post:
 *     summary: Forgot password
 *     description: An email will be sent to reset password.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *             example:
 *               email: fake@example.com
 *     responses:
 *       "204":
 *         description: No content
 *       "404":
 *         $ref: '#/components/responses/NotFound'
 */

/**
 * @swagger
 * /auth/reset-password:
 *   post:
 *     summary: Reset password
 *     tags: [Auth]
 *     parameters:
 *       - in: query
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: The reset password token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - password
 *             properties:
 *               password:
 *                 type: string
 *                 format: password
 *                 minLength: 8
 *                 description: At least one number and one letter
 *             example:
 *               password: password1
 *     responses:
 *       "204":
 *         description: No content
 *       "401":
 *         description: Password reset failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               code: 401
 *               message: Password reset failed
 */

/**
 * @swagger
 * /auth/send-verification-email:
 *   post:
 *     summary: Send verification email
 *     description: An email will be sent to verify email.
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       "204":
 *         description: No content
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 */

/**
 * @swagger
 * /auth/verify-email:
 *   post:
 *     summary: verify email
 *     tags: [Auth]
 *     parameters:
 *       - in: query
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: The verify email token
 *     responses:
 *       "204":
 *         description: No content
 *       "401":
 *         description: verify email failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               code: 401
 *               message: verify email failed
 */
