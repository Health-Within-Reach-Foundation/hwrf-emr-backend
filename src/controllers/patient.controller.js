const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const { patientService, clinicService, appointmentService, dentalService } = require('../services');
const generateRegNo = require('../utils/generate-regNo');

const createPatient = catchAsync(async (req, res) => {
  const clinic = await clinicService.getClinicById(req.user.clinicId);

  const clinicInitials = clinic.clinicName.substring(0, 2).toUpperCase();
  const lastPatient = await patientService.getLastPatientRegistered(req.user.clinicId, clinicInitials);
  console.log(clinicInitials, lastPatient, '***************');
  const registrationNumber = generateRegNo(clinicInitials, lastPatient);
  console.log(registrationNumber, '***************');
  const patientData = {
    ...req.body, // Spread the properties from req.body
    regNo: registrationNumber, // Add regNo to the patientData object
    clinicId: req.user.clinicId,
  };
  const patient = await patientService.createPatient(patientData);

  res.status(httpStatus.CREATED).json({
    success: true,
    message: 'Patient added successfully',
    // patientId: patient.id,
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
  const patients = await patientService.getPatientsByClinic(req.user.clinicId);
  res.status(httpStatus.OK).json(patients);
});

const getPatientDetailsById = catchAsync(async (req, res) => {
  console.log('user speciality ->', req.user.specialties[0]);
  const patientId = req.params.patientId;
  const specialtyId = req.query.specialtyId;

  const patient = await patientService.getPatientDetailsById(patientId, specialtyId);
  res.status(httpStatus.OK).json({
    success: true,
    data: patient,
    message: 'Patient details fetched successfully',
  });
});

module.exports = {
  createPatient,
  addDentalPatientRecord,
  getPatientsByClinic,
  getPatientDetailsById,
};
