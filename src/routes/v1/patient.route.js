const express = require('express');
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const roleAuthorization = require('../../middlewares/role-authorise');
const { patientValidation, appointmentValidation } = require('../../validations');
const { patientController } = require('../../controllers');

const router = express.Router();

router
  .route('/')
  .post(
    auth(),
    roleAuthorization('admin', 'receptionist', 'doctor'),
    validate(patientValidation.createPatient),
    patientController.createPatient
  )
  .get(
    auth(), // Authentication middleware
    roleAuthorization('admin', 'receptionist', 'doctor'),
    patientController.getPatientsByClinic // Controller
  );



router.route('/:patientId').get(auth(), validate(patientValidation.getPatientById), patientController.getPatientDetailsById);

router
  .route('/dental-records')
  .post(
    auth(),
    roleAuthorization('doctor', 'receptionist'),
    validate(patientValidation.addDentalPatientRecord),
    patientController.addDentalPatientRecord
  );

module.exports = router;
