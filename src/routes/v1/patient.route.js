const express = require('express');
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const roleAuthorization = require('../../middlewares/role-authorise');
const { patientValidation, appointmentValidation } = require('../../validations');
const { patientController } = require('../../controllers');
const multer = require('multer');
const path = require('path');
const parseArrayFields = require('../../middlewares/parser');
const { storage } = require('../../utils/file-upload-to-storage');
// Define custom multer instance in the route
const upload = multer({
  storage,
  // fileFilter,
  // limits: {
  //   fileSize: 10 * 1024 * 1024, // Custom file size limit for this route
  // },
});

const router = express.Router();

router
  .route('/')
  .post(
    auth(),
    // roleAuthorization('admin', 'receptionist', 'doctor'),
    validate(patientValidation.createPatient),
    patientController.createPatient
  )
  .get(
    auth(), // Authentication middleware
    // roleAuthorization('admin', 'receptionist', 'doctor'),
    patientController.getPatientsByClinic // Controller
  );

router.route('/dental-records').post(
  auth(),
  // roleAuthorization('doctor', 'receptionist'),
  validate(patientValidation.addDentalPatientRecord),
  patientController.addDentalPatientRecord
);

router
  .route('/diagnosis')
  .post(
    auth(),
    upload.array('xrayFiles'),
    parseArrayFields([
      'complaints',
      'treatmentsSuggested',
      'currentStatus',
      'selectedTeeth',
      'childSelectedTeeth',
      'adultSelectedTeeth',
    ]),
    (req, res, next) => {
      console.log('req body --------', req.body, req.files);
      next();
    },

    validate(patientValidation.createDiagnosis),
    patientController.createDiagnosis
  )
  .get(auth(), validate(patientValidation.getDiagnoses), patientController.getDiagnoses);

router
  .route('/diagnosis/:diagnosisId')
  .get(
    auth(),
    // roleAuthorization('diagnosis:read'),
    validate(patientValidation.getDiagnosis),
    patientController.getDiagnosis
  )
  .patch(
    auth(),
    upload.array('xrayFiles'),

    parseArrayFields([
      'complaints',
      'treatmentsSuggested',
      'currentStatus',
      'dentalQuadrant',
      'selectedTeeth',
      'childSelectedTeeth',
      'adultSelectedTeeth',
    ]),

    (req, res, next) => {
      console.log('req body --------', req.body, req.files);
      next();
    },
    // roleAuthorization('diagnosis:write'),
    validate(patientValidation.updateDiagnosis),
    patientController.updateDiagnosis
  )
  .delete(
    auth(),
    // roleAuthorization('diagnosis:delete'),
    validate(patientValidation.deleteDiagnosis),
    patientController.deleteDiagnosis
  );

router
  .route('/treatment')
  .post(
    auth(),
    upload.array('xrayFiles'),
    parseArrayFields(['treatmentStatus']),
    (req, res, next) => {
      console.log('req body --------', req.body, req.files);
      next();
    },
    validate(patientValidation.createTreatment),
    patientController.createTreatment
  )
  .get(auth(), validate(patientValidation.getTreatments), patientController.getTreatments);

router
  .route('/treatment/:treatmentId')
  .get(auth(), validate(patientValidation.getTreatmentById), patientController.getTreatmentById)
  .patch(
    auth(),
    upload.array('xrayFiles'),
    (req, res, next) => {
      console.log('req body --------', req.body, req.files);
      next();
    },
    parseArrayFields(['treatmentStatus']),
    validate(patientValidation.updateTreatment),
    patientController.updateTreatment
  )
  .delete(auth(), validate(patientValidation.deleteTreatment), patientController.deleteTreatment);

router
  .route('/:patientId')
  .get(auth(), validate(patientValidation.getPatientById), patientController.getPatientDetailsById)
  .patch(
    auth(),
    // roleAuthorization('admin', 'receptionist', 'doctor'),
    validate(patientValidation.updatePatient),
    patientController.updatePatientDetails
  );

module.exports = router;
