const { Op } = require('sequelize');
const { Patient } = require('../models/patient.model');
const { Appointment } = require('../models/appointment.model');
const { PatientRecord } = require('../models/patient-record.model');
const { DentistPatientRecord } = require('../models/dentist-patient-record');
const { Queue } = require('../models/queue.model');

/**
 *
 * @param {Object} patientBody
 * @returns {Promise<Patient>}
 */
const createPatient = async (patientBody) => {
  //   const isPatientExist = await Patient.findOne({ where: {} })
  return Patient.create(patientBody);
};

/**
 * Search for patients based on dynamic filters.
 * @param {Object} searchCriteria - Criteria for searching patients.
 * @param {string} [searchCriteria.name] - Full name of the patient.
 * @param {string} [searchCriteria.mobile] - Mobile number of the patient.
 * @param {string} [searchCriteria.registrationNumber] - Registration number of the patient.
 * @returns {Promise<Array>} - List of patients matching the criteria.
 */
const searchPatients = async (searchCriteria) => {
  const { name, mobile, registrationNumber } = searchCriteria;

  // Build the dynamic query object
  const where = {};
  if (name) {
    where.name = { [Op.iLike]: `%${name}%` }; // Case-insensitive partial match
  }
  if (mobile) {
    where.mobile = mobile; // Exact match
  }
  if (registrationNumber) {
    where.registrationNumber = registrationNumber; // Exact match
  }

  // Query the database for matching patients
  const patients = await Patient.findAll({ where });

  return patients;
};

/**
 *
 * @param {String} patientId
 * @returns {Promise<Patient>}
 */
const getPatientById = async (patientId) => {
  return Patient.findByPk(patientId);
};

/**
 * Get all patients by clinic ID.
 * @param {string} clinicId - The clinic ID.
 * @param {object} queryOptions - Pagination and sorting options.
 * @returns {Promise<object>}
 */
const getPatientsByClinic = async (clinicId) => {
  // const { page = 1, limit = 10 } = queryOptions;

  // const offset = (page - 1) * limit;

  const { rows: patients, count: total } = await Patient.findAndCountAll({
    where: { clinicId },
    // limit: parseInt(limit, 10),
    // offset: parseInt(offset, 10),
    order: [['createdAt', 'DESC']],
  });

  if (!patients.length) {
    throw new ApiError(httpStatus.NOT_FOUND, 'No patients found for this clinic.');
  }

  return {
    success: true,
    data: patients,
    meta: {
      total,
      // page,
      // limit,
      // totalPages: Math.ceil(tota l / limit),
    },
  };
};

/**
 * Update a patient's data by ID.
 * @param {String} patientId - The ID of the patient to update.
 * @param {Object} updateBody - The updated fields for the patient.
 * @returns {Promise<Patient>} - The updated patient.
 */
const updatePatientById = async (patientId, updateBody) => {
  // Fetch the patient record
  const patient = await getPatientById(patientId);

  if (!patient) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Patient not found');
  }

  // Update only the provided fields
  Object.assign(patient, updateBody);

  // Save the updated patient
  await patient.save();

  return patient;
};

/**
 * Delete a patient record by ID (soft delete or permanent delete).
 * @param {String} patientId - The ID of the patient to delete.
 * @param {Boolean} [permanent=false] - If true, permanently delete the record.
 * @returns {Promise<void>}
 */
const deletePatientById = async (patientId, permanent = false) => {
  // Find the patient by ID
  const patient = await getPatientById(patientId);
  if (!patient) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Patient not found');
  }

  // Perform soft delete or permanent delete based on the `permanent` flag
  if (permanent) {
    await patient.destroy({ force: true }); // Permanently delete
  } else {
    await patient.destroy(); // Soft delete (sets `deletedAt` field)
  }
};

const getLastPatientRegistered = async (clinicId, clinicInitials) => {
  // Find the last patient registered for the given clinic based on createdAt and regNo
  const lastPatient = await Patient.findOne({
    where: {
      regNo: { [Op.like]: `${clinicInitials}%` }, // regNo starts with the clinic ID (e.g., AP)
    },
    order: [
      ['createdAt', 'DESC'], // Order by createdAt in descending order to get the most recent patient
      ['regNo', 'DESC'], // If two patients were created at the same time, sort by regNo
    ],
    limit: 1, // Only fetch the first result after ordering
  });

  return lastPatient;
};

/**
 * Get patient by ID, including all related models.
 * @param {string} patientId - ID of the patient
 * @returns {Promise<Patient>}
 */
const getPatientDetailsById = async (patientId, specialtyId) => {
  const patient = await Patient.findByPk(patientId, {
    include: [
      // Include related Clinic data
      // Include Appointments associated with the patient
      {
        model: Appointment,
        where: {
          specialtyId,
        },
        as: 'appointments',
        attributes: { exclude: ['createdAt', 'updatedAt'] },
      },
      // Include Patient Records
      {
        model: PatientRecord,
        as: 'records',
        include: [
          {
            model: DentistPatientRecord, // Include Dentist-specific data
            as: 'dentalData',
            attributes: { exclude: ['createdAt', 'updatedAt'] },
          },
        ],
      },
      // Include Queue records for the patient
      {
        model: Queue,
        where: {
          specialtyId,
        },
        as: 'queues',
        attributes: { exclude: ['createdAt', 'updatedAt'] },
      },
    ],
  });

  // Throw an error if no patient is found
  if (!patient) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Patient not found');
  }

  return patient;
};

module.exports = {
  createPatient,
  searchPatients,
  getPatientById,
  getPatientsByClinic,
  updatePatientById,
  deletePatientById,
  getLastPatientRegistered,
  getPatientDetailsById,
};
