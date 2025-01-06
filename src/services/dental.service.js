const httpStatus = require('http-status');
const { PatientRecord } = require('../models/patient-record.model');
const { DentistPatientRecord } = require('../models/dentist-patient-record');
const { Patient } = require('../models/patient.model');
const { Appointment } = require('../models/appointment.model');
const ApiError = require('../utils/ApiError');

/**
 * Add dentist patient record
 * @param {string} patientId - ID of the patient
 * @param {Object} recordData - Data for the dentist record
 * @returns {Promise<DentistPatientRecord>}
 */

/**
 * Add Dentist Patient Record
 * @param {Object} recordData
 * @returns {Promise<DentistPatientRecord>}
 */
const addDentalPatientRecord = async (recordData) => {
  const { appointmentId, patientId, complaints, treatment, dentalQuadrant, xrayStatus, xray, notes, billing } = recordData;

  console.log("req.body -->", recordData)
  // Step 1: Check if appointment exists
  const appointment = await PatientRecord.findOne({
    where: { appointmentId, patientId },
  });

  if (appointment) {
    throw new ApiError(httpStatus.CONFLICT, 'Record with this appointment already exists');
  }

  // Step 2: Create a Patient Record (General Record)
  const patientRecord = await PatientRecord.create({
    appointmentId,
    patientId,
    description: complaints.join(', '), // Combine complaints into description
    billingDetails: billing,
  });

  // Step 3: Create Dentist Specific Record
  const dentistRecord = await DentistPatientRecord.create({
    recordId: patientRecord.id, // Link to general patient record
    complaints,
    treatment,
    dentalQuadrant, // Stored as JSON object
    toothNumber: Object.values(dentalQuadrant).flat(), // Flatten tooth numbers
    xrayStatus,
    xray,
    notes,
    //   billing,
  });

  return dentistRecord;
};

module.exports = {
  addDentalPatientRecord,
};
