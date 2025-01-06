const express = require('express');
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const roleAuthorization = require('../../middlewares/role-authorise');
const { clinicValidation, userValidation } = require('../../validations');
const { clinicController, userController } = require('../../controllers');

const router = express.Router();

// router
//   .route('/patients')
//   .post(
//     auth(),
//     roleAuthorization('admin', 'receptionist', 'doctor'),
//     validate(patientValidation.createPatient),
//     patientController.createPatient
//   )
//   .get(
//     auth(), // Authentication middleware
//     roleAuthorization('admin', 'receptionist', 'doctor'),
//     validate(patientValidation.getPatientsByClinic), // Validation
//     patientController.getPatientsByClinic // Controller
//   );
router
  .route('/specialty-department')
  .get(auth(), roleAuthorization('admin', 'receptionist', 'doctor'), clinicController.getSpecialtyDepartmentsByClinic);

// router.route('/add-patient').post(auth(), roleAuthorization('admin'), validate());

router
  .route('/user')
  .post(auth(), roleAuthorization('admin'), validate(userValidation.createUser), userController.createClinicUser)
  .get(auth(), roleAuthorization('admin'), clinicController.getUsersByClinic);

router
  .route('/:clinicId')
  .get(auth(), roleAuthorization('superadmin', 'admin'), validate(clinicValidation.getClinic), clinicController.getClinic);
module.exports = router;
