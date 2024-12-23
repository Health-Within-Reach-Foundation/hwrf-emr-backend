const { Op } = require('sequelize');
const { Patient } = require('../models/patient.model');

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
 * Fetch all patients under a specific clinic with pagination and optional filters.
 * @param {String} clinicId - The ID of the clinic.
 * @param {Object} query - Query parameters for filtering and pagination.
 * @param {String} [query.name] - Filter by patient name (optional).
 * @param {String} [query.mobile] - Filter by patient mobile number (optional).
 * @param {Number} [query.page=1] - Page number for pagination.
 * @param {Number} [query.limit=10] - Number of records per page.
 * @returns {Promise<Object>} - Paginated list of patients.
 */
const getPatientsByClinic = async (clinicId, query) => {
  const { name, mobile, page = 1, limit = 10 } = query;

  // Build the dynamic filter object
  const where = { clinic_id: clinicId }; // Scope patients to the given clinic
  if (name) {
    where.name = { [Op.iLike]: `%${name}%` }; // Case-insensitive partial match
  }
  if (mobile) {
    where.mobile = mobile; // Exact match
  }

  // Pagination settings
  const offset = (page - 1) * limit;

  // Query the database with filters and pagination
  const { rows: patients, count: total } = await Patient.findAndCountAll({
    where,
    offset,
    limit: parseInt(limit, 10),
    order: [['createdAt', 'DESC']], // Sort by most recent patients
  });

  // Prepare paginated response
  // return {
  //   success: true,
  //   message: 'Patients retrieved successfully',
  //   data: {
  //     patients,
  //     pagination: {
  //       total,
  //       currentPage: parseInt(page, 10),
  //       totalPages: Math.ceil(total / limit),
  //       pageSize: parseInt(limit, 10),
  //     },
  //   },
  // };
  return {
    patients,
    pagination: {
      total,
      currentPage,
      totalPages: Math.ceil(total / limit),
      pageSize: parseInt(limit, 10),
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


module.exports = {
  createPatient,
  searchPatients,
  getPatientById,
  getPatientsByClinic,
  updatePatientById,
  deletePatientById
};
