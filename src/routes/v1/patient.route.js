const express = require('express');
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const roleAuthorization = require('../../middlewares/role-authorise');
const { patientValidation, appointmentValidation } = require('../../validations');
const { patientController } = require('../../controllers');
const multer = require('multer');
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

/* **************************** Pateint crud route ******************************** */
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

router.route('/follow-ups').get(auth(), patientController.getPatientFollowUps);

/* **************************** Pateint crud route ******************************** */

/* **************************** Pateint dental crud routes ******************************** */

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
      // 'diagnosisDate',
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
    parseArrayFields([
      'treatmentStatus',
      'treatingDoctor',
      // 'treatmentDate',
      // 'nextDate'
    ]),
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
    parseArrayFields([
      'treatmentStatus',
      'treatingDoctor',
      // 'nextDate'
    ]),
    validate(patientValidation.updateTreatment),
    patientController.updateTreatment
  )
  .delete(auth(), validate(patientValidation.deleteTreatment), patientController.deleteTreatment);

/* **************************** Pateint dental crud routes ******************************** */

/* **************************** Pateint mammography crud routes ******************************** */

router
  .route('/mammography/:patientId')
  .post(
    auth(),
    // There are two files sepratly comming from the front end for this api 1. screeningFile 2. aiReport, how to handle this in multer
    validate(patientValidation.createMammography),
    upload.fields([{ name: 'screeningFile' }, { name: 'aiReport' }]),
    parseArrayFields([
      'smokingDetails',
      'imagingStudies',
      'obstetricHistory',
      'misheriTobaccoDetails',
      'alcoholDetails',
      'numberOfPregnancies',
      'previousTreatmentDetails',
    ]),
    patientController.createMammography
  )
  .patch(
    auth(),
    // upload.single('screeningFile'),
    validate(patientValidation.updateMammography),
    upload.fields([{ name: 'screeningFile' }, { name: 'aiReport' }]),
    (req, res, next) => {
      console.log('req body --------', req.body, req.files);
      next();
    },
    parseArrayFields([
      'smokingDetails',
      'imagingStudies',
      'obstetricHistory',
      'misheriTobaccoDetails',
      'alcoholDetails',
      'previousTreatmentDetails',
    ]),
    patientController.updateMammography
  )
  .get(auth(), validate(patientValidation.getMammography), patientController.getMammography);

/* **************************** Pateint mammography crud routes ******************************** */

/* **************************** Pateint GP crud routes ******************************** */

router
  .route('/gp-records')
  .post(
    auth(),
    (req, res, next) => {
      console.log('req body --------', req.body, req.files);
      next();
    },
    validate(patientValidation.createGPRecord),
    patientController.createGPRecord
  )
  .get(auth(), validate(patientValidation.getGPRecordsByPatient), patientController.getGPRecordsByPatient);

router
  .route('/gp-records/:gpRecordId')
  .patch(auth(), validate(patientValidation.updateGPRecord), patientController.updateGPRecord)
  .get(auth(), validate(patientValidation.getGPRecord), patientController.getGPRecordById)
  .delete(auth(), validate(patientValidation.getGPRecord), patientController.deleteGPRecord);

/* **************************** Pateint GP crud routes ******************************** */

/* **************************** Pateint crud routes ******************************** */
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
