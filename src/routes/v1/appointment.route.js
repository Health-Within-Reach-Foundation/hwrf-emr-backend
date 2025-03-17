const express = require('express');
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const roleAuthorization = require('../../middlewares/role-authorise');
const { appointmentValidation } = require('../../validations');
const { appointmentController } = require('../../controllers');

const router = express.Router();

router.route('/').get(
  auth(), // Authenticate the user
  // roleAuthorization('queues:read'),
  validate(appointmentValidation.getAppointments), // Validate query parameters
  appointmentController.getAppointments // Fetch appointments
);

router.route('/book').post(
  (req, res, next) => {
    console.log('inside booking route --------------------------------');
    next();
  },
  auth(), // Authenticate the user
  // roleAuthorization('queues:write'),
  validate(appointmentValidation.createAppointment), // Validate request
  appointmentController.bookAppointment // Controller
);

router
  .route('/:appointmentId')
  .patch(auth(), validate(appointmentValidation.updateAppointment), appointmentController.updateAppointment);

module.exports = router;
