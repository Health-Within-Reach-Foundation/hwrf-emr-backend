const { Op } = require('sequelize');
const { Patient } = require('../models/patient.model');
const { Appointment } = require('../models/appointment.model');
const { PatientRecord } = require('../models/patient-record.model');
const { DentistPatientRecord } = require('../models/dentist-patient-record');
const { Queue } = require('../models/queue.model');
const { Camp } = require('../models/camp.model');
const ApiError = require('../utils/ApiError');
const httpStatus = require('http-status');
const { Diagnosis } = require('../models/diagnosis.model');
const { Treatment } = require('../models/treatment.model');
const { TreatmentSetting } = require('../models/treatment-setting.model');

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
 * Get patients by clinic ID and optionally by camp ID.
 * @param {string} clinicId - The clinic ID.
 * @param {string|null} currentCampId - The camp ID (if filtering by camp).
 * @returns {Promise<object>}
 */
const getPatientsByClinic = async (clinicId) => {
  const whereClause = { clinicId };

  // Include conditionally based on currentCampId
  const includeCamps = {
    model: Camp,
    as: 'camps',
    attributes: [], // Exclude Camp fields if not needed
    through: { attributes: [] }, // Exclude junction table fields
  };

  const { rows: patients, count: total } = await Patient.findAndCountAll({
    where: whereClause,
    include: [includeCamps],
    order: [['createdAt', 'DESC']],
  });

  if (!patients.length) {
    throw new ApiError(httpStatus.NOT_FOUND, 'No patients found for this clinic or camp.');
  }

  return {
    success: true,
    data: patients,
    meta: {
      total,
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

/**
 * Get the last registered patient with the highest regNo for a given clinic.
 * @param {UUID} clinicId - The clinic ID.
 * @returns {Promise<Patient | null>} The last registered patient or null if none exist.
 */
const getLastPatientRegistered = async (clinicId) => {
  try {
    // Find the patient with the highest regNo in the given clinic
    const lastPatient = await Patient.findOne({
      where: { clinicId },
      order: [['regNo', 'DESC']], // Sorting by regNo to get the highest number
      limit: 1, // Fetch only the top record
    });

    return lastPatient || null; // Return null if no patient is found
  } catch (error) {
    console.error('Error fetching last registered patient:', error);
    throw new Error('Failed to fetch last registered patient');
  }
};

/**
 * Get patient by ID, including all related models.
 * @param {string} patientId - ID of the patient
 * @returns {Promise<Patient>}
 */
const getPatientDetailsById = async (patientId, specialtyId) => {
  console.log(typeof specialtyId, specialtyId);

  // Build the where clause dynamically for specialty filtering
  const where = {};
  if (specialtyId && specialtyId !== 'undefined') {
    where.specialtyId = specialtyId;
  }

  console.log('where -->', where);

  const patient = await Patient.findByPk(patientId, {
    include: [
      // Include Appointments with optional specialty filtering
      {
        model: Appointment,
        where, // Filter by specialty if provided
        as: 'appointments',
        attributes: { exclude: ['createdAt', 'updatedAt'] },
        required: false, // Use LEFT JOIN to ensure patient is returned even if no appointments exist
      },
      // Include Patient Records
      {
        model: Diagnosis,
        as: 'diagnoses',
        include: [
          {
            model: Treatment, // Include Dentist-specific data
            as: 'treatment',
            attributes: { exclude: ['createdAt', 'updatedAt'] },
            order: [['createdAt', 'ASC']], // Sort by creation date (latest first)
            include: [
              {
                model: TreatmentSetting,
                as: 'treatmentSettings',
              },
            ],
          },
        ],

        order: [['createdAt', 'ASC']], // Sort by creation date (latest first)
        required: false, // Ensure patient is returned even if no records exist
      },
      {
        model: Queue,
        where, // Filter by specialty if provided
        as: 'queues',
        attributes: { exclude: ['createdAt', 'updatedAt'] },
        required: false, // Use LEFT JOIN to ensure patient is returned even if no queues exist
      },
    ],
  });

  // Throw an error if no patient is found
  if (!patient) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Patient not found');
  }

  return patient;
};

const createDiagnosis = async (diagnosisBody) => {
  const { selectedTeeth, complaints, treatmentsSuggested, dentalQuadrantType, xrayStatus, notes, patientId } = diagnosisBody;

  // Ensure the patient exists
  const patient = await Patient.findByPk(patientId);
  if (!patient) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Patient not found');
  }

  // Ensure the appointment exists if appointmentId is provided
  // if (appointmentId) {
  //   const appointment = await Appointment.findByPk(appointmentId);
  //   if (!appointment) {
  //     throw new ApiError(httpStatus.NOT_FOUND, 'Appointment not found');
  //   }
  // }

  // Create the diagnosis
  let diagnosis;
  if (selectedTeeth.length > 0) {
    selectedTeeth.forEach(async (element) => {
      diagnosis = await Diagnosis.create({
        complaints,
        treatmentsSuggested,
        selectedTeeth: element,
        dentalQuadrantType,
        xrayStatus,
        notes,
        patientId,
      });
    });
  } else {
    diagnosis = await Diagnosis.create({
      complaints,
      treatmentsSuggested,
      dentalQuadrantType,
      xrayStatus,
      notes,
      patientId,
    });
  }

  // return diagnosis;
};

const getDiagnoses = async (queryOptions) => {
  const { patientId, page = 1, limit = 10 } = queryOptions;
  const offset = (page - 1) * limit;

  const where = {};
  if (patientId) {
    where.patientId = patientId;
  }

  const { rows: diagnoses, count: total } = await Diagnosis.findAndCountAll({
    where,
    limit: parseInt(limit, 10),
    offset: parseInt(offset, 10),
    order: [['createdAt', 'DESC']],
  });

  return {
    data: diagnoses,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

const getDiagnosisById = async (diagnosisId) => {
  const diagnosis = await Diagnosis.findByPk(diagnosisId, {
    include: [
      {
        model: Treatment,
        as: 'treatment',
        include: [
          {
            model: TreatmentSetting,
            as: 'treatmentSettings',
          },
        ],
        // attributes:
      },
    ],
  });

  if (!diagnosis) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Diagnosis not found');
  }
  return diagnosis;
};

const updateDiagnosis = async (diagnosisId, updateBody) => {
  const diagnosis = await getDiagnosisById(diagnosisId);
  const treatments = await Treatment.findAll({ where: { diagnosisId } });
  const { complaints, treatmentsSuggested, dentalQuadrantType, selectedTeeth, xrayStatus, xray, notes } = updateBody;
  const updatedTreatmentBody = {
    complaints,
    treatments: treatmentsSuggested,
    dentalQuadrantType,
    selectedTeeth,
    xrayStatus,
    xray,
    notes,
  };

  if (treatments.length > 0) {
    treatments.forEach(async (treatment) => {
      Object.assign(treatment, updatedTreatmentBody);
      await treatment.save();
    });
  }

  Object.assign(diagnosis, updateBody);
  await diagnosis.save();
  return diagnosis;
};

const deleteDiagnosis = async (diagnosisId) => {
  const diagnosis = await getDiagnosisById(diagnosisId);
  await diagnosis.destroy({ force: true });
};

// const createTreatment = async (treatmentBody) => {
//   const { diagnosisId, treatmentDate, treatmentStatus, notes, totalAmount, paidAmount, remainingAmount, paymentStatus } =
//     treatmentBody;

//   try {
//     const diagnosis = await Diagnosis.findByPk(diagnosisId);

//     if (!diagnosis) {
//       throw ApiError(httpStatus.NOT_FOUND, 'Diagnosis not found');
//     }

//     const treatmentCreated = await Treatment.create({
//       treatmentDate,
//       complaints: diagnosis.complaints,
//       treatments: diagnosis.treatmentsSuggested,
//       dentalQuadrantType: diagnosis.dentalQuadrantType,
//       selectedTeeth: diagnosis.selectedTeeth,
//       xrayStatus: diagnosis.xrayStatus,
//       xray: diagnosis.xray,
//       treatmentStatus,
//       notes,
//       totalAmount,
//       paidAmount,
//       remainingAmount,
//       paymentStatus,
//       diagnosisId,
//     });
//     return treatmentCreated;
//   } catch (error) {
//     console.error(error);
//     throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Internal Server error');
//   }
// };

const createTreatment = async (treatmentBody) => {
  const {
    diagnosisId,
    treatmentDate,
    treatmentStatus,
    notes,
    totalAmount,
    // paidAmount,
    // remainingAmount,
    paymentStatus,
    settingPaidAmount,
  } = treatmentBody;

  try {
    // Find existing diagnosis
    const diagnosis = await Diagnosis.findByPk(diagnosisId);
    if (!diagnosis) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Diagnosis not found');
    }

    // Check if there's an existing treatment for this diagnosis
    let treatment = await Treatment.findOne({
      where: { diagnosisId },
    });

    // If no existing treatment, create one
    if (!treatment) {
      treatment = await Treatment.create({
        complaints: diagnosis.complaints,
        treatments: diagnosis.treatmentsSuggested,
        xrayStatus: diagnosis.xrayStatus,
        xray: diagnosis.xray,
        treatmentStatus,
        // notes,
        totalAmount,
        paidAmount: settingPaidAmount,
        remainingAmount: totalAmount - settingPaidAmount,
        paymentStatus,
        diagnosisId,
      });
    } else {
      treatment.paidAmount = Number(treatment.paidAmount) + Number(settingPaidAmount);
      treatment.remainingAmount = Number(treatment.totalAmount) - Number(treatment.paidAmount + settingPaidAmount);

      await treatment.save();
    }

    // Create an entry in TreatmentSetting linked to this treatment
    const treatmentSetting = await TreatmentSetting.create({
      treatmentDate,
      treatmentStatus,
      notes,
      settingPaidAmount,
      additionalDetails: treatmentBody.additionalDetails || {},
      treatmentId: treatment.id, // Associate with the found/created Treatment
    });

    return treatmentSetting;
  } catch (error) {
    console.error(error);
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Internal Server Error');
  }
};

const getTreatments = async ({ diagnosisId, page = 1, limit = 10 }) => {
  const offset = (page - 1) * limit;
  const { rows, count } = await Treatment.findAndCountAll({
    where: { diagnosisId },
    limit,
    offset,
    order: [['treatmentDate', 'DESC']],
    include: [
      {
        model: TreatmentSetting,
        as: 'treatmentSettings',
      },
      {
        model: Diagnosis,
        as: 'diagnosis',
      },
    ],
  });

  return { treatments: rows, total: count, page, totalPages: Math.ceil(count / limit) };
};

const getTreatmentById = async (treatmentId) => {
  const treatment = await Treatment.findByPk(treatmentId, {
    include: [
      {
        model: TreatmentSetting,
        as: 'treatmentSettings',
      },
      {
        model: Diagnosis,
        as: 'diagnosis',
      },
    ],
  });

  if (!treatment) throw new Error('Treatment not found');
  return treatment;
};

// const updateTreatment = async (treatmentId, updateBody) => {
//   const treatment = await getTreatmentById(treatmentId);
//   Object.assign(treatment, updateBody);
//   await treatment.save();
//   return treatment;
// };

const updateTreatment = async (treatmentId, updateBody) => {
  const {
    treatmentSettingId,
    settingTreatmentDate,
    settingNotes,
    settingAdditionalDetails,
    settingPaidAmount = 0, // Default to 0 if not provided
    ...treatmentFields // Extract Treatment fields separately
  } = updateBody;

  // Fetch Treatment by ID
  const treatment = await getTreatmentById(treatmentId);
  if (!treatment) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Treatment not found');
  }

  // ✅ Update Treatment only if there are fields to update
  if (Object.keys(treatmentFields).length > 0) {
    Object.assign(treatment, treatmentFields);
    await treatment.save();
  }

  let updatedTreatmentSetting = null;
  if (treatmentSettingId) {
    // If treatmentSettingId is provided, update the existing TreatmentSetting
    updatedTreatmentSetting = await TreatmentSetting.findByPk(treatmentSettingId);
    if (!updatedTreatmentSetting) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Treatment setting not found');
    }

    Object.assign(updatedTreatmentSetting, {
      treatmentDate: settingTreatmentDate,
      notes: settingNotes,
      additionalDetails: settingAdditionalDetails,
      paidAmount: settingPaidAmount, // Storing paid amount at setting level
    });
    await updatedTreatmentSetting.save();
  }
  //  else {
  //   // If no treatmentSettingId, create a new TreatmentSetting under this treatment
  //   updatedTreatmentSetting = await TreatmentSetting.create({
  //     treatmentId,
  //     treatmentDate: settingTreatmentDate || treatment.createdAt,
  //     notes: settingNotes,
  //     additionalDetails: settingAdditionalDetails,
  //     treatmentStatus: treatmentFields.treatmentStatus, // Use from treatment fields
  //     paidAmount: settingPaidAmount,
  //   });
  // }

  // ✅ Recalculate Paid & Remaining Amounts for Treatment
  const totalPaidAmount = treatment.paidAmount + settingPaidAmount;
  const remainingAmount = treatment.totalAmount - totalPaidAmount;

  // ✅ Update Treatment's financial details
  treatment.paidAmount = totalPaidAmount;
  await treatment.save();
  treatment.remainingAmount = remainingAmount <= 0 ? 0 : remainingAmount;
  await treatment.save();

  // ✅ Ensure paymentStatus updates correctly
  if (remainingAmount <= 0) {
    treatment.paymentStatus = 'paid'; // Mark as paid if no remaining balance
  } else {
    treatment.paymentStatus = 'pending'; // Keep it pending if amount is due
  }

  // ✅ Save the updated Treatment
  await treatment.save();

  // ✅ Return updated treatment with the treatment setting
  return {
    treatment: await treatment.reload(),
    treatmentSetting: updatedTreatmentSetting,
  };
};

const deleteTreatment = async (treatmentId) => {
  const treatment = await getTreatmentById(treatmentId);
  await treatment.destroy({ force: true });
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
  createDiagnosis,
  getDiagnoses,
  getDiagnosisById,
  updateDiagnosis,
  deleteDiagnosis,
  createTreatment,
  getTreatments,
  getTreatmentById,
  updateTreatment,
  deleteTreatment,
};
