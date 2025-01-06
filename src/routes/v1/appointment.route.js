const express = require('express');
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const roleAuthorization = require('../../middlewares/role-authorise');
const { appointmentValidation } = require('../../validations');
const { patientController, appointmentController } = require('../../controllers');

const router = express.Router();

/**
 * @route GET /appointments
 * @desc Fetch appointments with filters and sorting
 * @access Private (requires authentication)
 */
router.route('/').get(
  auth(), // Authenticate the user
  roleAuthorization('admin', 'receptionist', 'doctor'),
  validate(appointmentValidation.getAppointments), // Validate query parameters
  appointmentController.getAppointments // Fetch appointments
);

router.route('/book').post(
  auth(), // Authenticate the user
  roleAuthorization('admin', 'receptionist', 'doctor'),
  validate(appointmentValidation.createAppointment), // Validate request
  appointmentController.bookAppointment // Controller
);

module.exports = router;
