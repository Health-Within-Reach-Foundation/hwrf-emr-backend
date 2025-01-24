const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const { patientService, clinicService, appointmentService, dentalService, campService } = require('../services');
const generateRegNo = require('../utils/generate-regNo');

const createPatient = catchAsync(async (req, res) => {
  const clinic = await clinicService.getClinicById(req.user.clinicId);
  if (!clinic) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Clinic not found');
  }

  const clinicInitials = clinic.clinicName.substring(0, 2).toUpperCase();
  const lastPatient = await patientService.getLastPatientRegistered(req.user.clinicId);
  const currentCampId = req.user.currentCampId;

  console.log(lastPatient);
  const registrationNumber = lastPatient?.regNo ? lastPatient?.regNo + 1 : 1;
  // const registrationNumber = generateRegNo("HWRF", lastPatient);

  if (!registrationNumber) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to generate registration number');
  }

  const patientData = {
    ...req.body,
    regNo: registrationNumber,
    clinicId: req.user.clinicId,
  };

  // Validate required fields
  if (!patientData.name || !patientData.age || !patientData.sex || !patientData.mobile || !patientData.clinicId) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Missing required fields for patient creation');
  }

  console.log('--------------------->', patientService, patientData);

  const patient = await patientService.createPatient(patientData);

  // Associate patient with the camp if applicable
  if (currentCampId) {
    const camp = await campService.getCampById(currentCampId);
    if (!camp) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Camp not found for the given ID');
    }
    await patient.addCamps([camp]);
  }

  res.status(httpStatus.CREATED).json({
    success: true,
    message: 'Patient added successfully',
    data: patient,
  });
});

// Controller to add dentist patient record
const addDentalPatientRecord = catchAsync(async (req, res) => {
  // const { patientId } = req.params;
  const record = await dentalService.addDentalPatientRecord(req.body);
  res.status(httpStatus.CREATED).json({
    success: true,
    message: 'Denatal patient record added successfully!',
    data: record,
  });
});

/**
 * Fetch all patients by clinic ID.
 */
const getPatientsByClinic = catchAsync(async (req, res) => {
  // const currentCampId = req.user.currentCampId;
  const clinicId = req.user.clinicId;

  const patients = await patientService.getPatientsByClinic(clinicId);
  res.status(httpStatus.OK).json(patients);
});

const getPatientDetailsById = catchAsync(async (req, res) => {
  // console.log('user speciality ->', req.user.specialties[0]);
  const patientId = req.params.patientId;
  const { specialtyId = null } = req.query;
  // const { specialtyId } = req.query;
  const patient = await patientService.getPatientDetailsById(patientId, specialtyId);
  res.status(httpStatus.OK).json({
    success: true,
    data: patient,
    message: 'Patient details fetched successfully',
  });
});

const updatePatientDetails = catchAsync(async (req, res) => {
  const patientId = req.params.patientId;
  const patientData = req.body;

  await patientService.updatePatientById(patientId, patientData);

  res.status(httpStatus.CREATED).json({
    success: true,
    message: 'Patient updated successfully',
    // data: updatedPatient,
  });
});

const createDiagnosis = catchAsync(async (req, res) => {
  const { files, body } = req;

  // Extract file URLs from uploaded files, if any
  const xrayFilePaths = files?.map((file) => file.path) || [];

  // Append file paths to the request body
  const diagnosisData = {
    ...body,
    xray: xrayFilePaths, // Attach uploaded file paths if available
  };

  await patientService.createDiagnosis(diagnosisData);

  res.status(httpStatus.CREATED).json({
    success: true,
    message: 'Diagnosis created successfully',
    // data: diagnosis,
  });
});

const getDiagnoses = catchAsync(async (req, res) => {
  console.log('getting diagnoses ');
  const diagnoses = await patientService.getDiagnoses(req.query);
  res.status(httpStatus.OK).json({
    success: true,
    data: diagnoses.data,
    meta: diagnoses.meta,
    message: 'diagnoses found',
  });
});

const getDiagnosis = catchAsync(async (req, res) => {
  const { files, body } = req;

  const diagnosis = await patientService.getDiagnosisById(req.params.diagnosisId);
  res.status(httpStatus.OK).json({
    success: true,
    data: diagnosis,
    message: 'diagnosis found',
  });
});

const updateDiagnosis = catchAsync(async (req, res) => {
  const { files, body } = req;

  // Extract file URLs from uploaded files, if any
  const xrayFilePaths = files?.map((file) => file.path) || [];

  // Append file paths to the request body
  const diagnosisData = {
    ...body,
    xray: xrayFilePaths, // Attach uploaded file paths if available
  };

  const diagnosis = await patientService.updateDiagnosis(req.params.diagnosisId, diagnosisData);
  res.status(httpStatus.OK).json({
    success: true,
    message: 'Diagnosis updated successfully',
    data: diagnosis,
  });
});

const deleteDiagnosis = catchAsync(async (req, res) => {
  await patientService.deleteDiagnosis(req.params.diagnosisId);
  res.status(httpStatus.NO_CONTENT).json({
    message: 'diagnosis deleted !',
    success: true,
  });
});

// const createTreatment = catchAsync(async (req, res) => {
//   const treatment = await patientService.createTreatment(req.body);
//   res.status(httpStatus.CREATED).json({ success: true, data: treatment });
// });
const createTreatment = catchAsync(async (req, res) => {
  const {files, body} = req;

  const xrayFilePaths = files?.map((file) => file.path) || [];
 
  const treatmentBody = {
    ...body,
    xray: xrayFilePaths, // Attach uploaded file paths if available
  };
  const treatmentSetting = await patientService.createTreatment(treatmentBody);
  
  res.status(httpStatus.CREATED).json({
    success: true,
    message: "Treatment created successfully",
    data: treatmentSetting,
  });
});


const getTreatments = catchAsync(async (req, res) => {
  const treatments = await patientService.getTreatments(req.query);
  res.status(httpStatus.OK).json({ success: true, data: treatments });
});

const getTreatmentById = catchAsync(async (req, res) => {
  const treatment = await patientService.getTreatmentById(req.params.treatmentId);
  res.status(httpStatus.OK).json({ success: true, data: treatment });
});

// const updateTreatment = catchAsync(async (req, res) => {
//   const updatedTreatment = await patientService.updateTreatment(req.params.treatmentId, req.body);
//   res.status(httpStatus.OK).json({ success: true, data: updatedTreatment });
// });

const updateTreatment = catchAsync(async (req, res) => {
  const updatedTreatment = await patientService.updateTreatment(req.params.treatmentId, req.body);
  res.status(httpStatus.OK).json({ success: true, data: updatedTreatment });
});


const deleteTreatment = catchAsync(async (req, res) => {
  await patientService.deleteTreatment(req.params.treatmentId);
  res.status(httpStatus.NO_CONTENT).send();
});

module.exports = {
  createPatient,
  addDentalPatientRecord,
  getPatientsByClinic,
  getPatientDetailsById,
  updatePatientDetails,
  createDiagnosis,
  getDiagnosis,
  getDiagnoses,
  updateDiagnosis,
  deleteDiagnosis,
  createTreatment,
  getTreatments,
  getTreatmentById,
  updateTreatment,
  deleteTreatment,
};
