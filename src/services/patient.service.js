const { Op } = require('sequelize');
const { Patient } = require('../models/patient.model');
const { Appointment } = require('../models/appointment.model');
const { Queue } = require('../models/queue.model');
const { Camp } = require('../models/camp.model');
const ApiError = require('../utils/ApiError');
const httpStatus = require('http-status');
const { Diagnosis } = require('../models/diagnosis.model');
const { Treatment } = require('../models/treatment.model');
const { Mammography } = require('../models/mammography.model');
const { TreatmentSetting } = require('../models/treatment-setting.model');
const { GeneralPhysicianRecord } = require('../models/gp-record.model');

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

  const { rows: patients, count: total } = await Patient.findAndCountAll({
    where: whereClause,
    include: [
      {
        model: Appointment,
        as: 'appointments',
        attributes: { exclude: ['createdAt', 'updatedAt'] },
        required: false, // Use LEFT JOIN to ensure patient is returned even if no appointments exist
      },
      {
        model: Queue,
        as: 'queues',
        attributes: { exclude: ['createdAt', 'updatedAt'] },
        required: false, // Use LEFT JOIN to ensure patient is returned even if no queues exist
      },
    ],
    order: [['createdAt', 'DESC']],
  });

  if (!patients.length) {
    throw new ApiError(httpStatus.NOT_FOUND, 'No patients found for this clinic or camp.');
  }

  const newPatients = patients.map((patient) => {
    const serviceTaken = patient.queues.map((queue) => queue.queueType);
    return { ...patient.dataValues, serviceTaken };
  });

  return {
    success: true,
    data: newPatients,
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
      // Include Mammography Records
      {
        model: Mammography,
        as: 'mammography',
        required: false, // Ensure patient is returned even if no records exist
      },
      {
        model: GeneralPhysicianRecord,
        as: 'gpRecords',
        required: false,
        order: [['createdAt', 'DESC']],
      },
      // {
      //   model: PatientRecord,
      //   as: 'records',
      //   include: [
      //     {
      //       model: DentistPatientRecord, // Include Dentist-specific data
      //       as: 'dentalData',
      //       attributes: { exclude: ['createdAt', 'updatedAt'] },
      //     },
      //   ],
      //   required: false, // Ensure patient is returned even if no records exist
      // },
      // Include Queue records for the patient
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
  const {
    selectedTeeth,
    childSelectedTeeth,
    adultSelectedTeeth,
    complaints,
    treatmentsSuggested,
    dentalQuadrantType,
    xrayStatus,
    notes,
    patientId,
    xray,
    estimatedCost,
    // campId,
  } = diagnosisBody;

  // Ensure the patient exists
  const patient = await Patient.findByPk(patientId);
  if (!patient) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Patient not found');
  }

  // Create the diagnosis and treatment instances
  const createDiagnosisAndTreatment = async (teeth, quadrantType) => {
    const diagnosis = await Diagnosis.create({
      complaints,
      treatmentsSuggested,
      selectedTeeth: teeth,
      dentalQuadrantType: quadrantType,
      xrayStatus,
      notes,
      xray,
      patientId,
      estimatedCost,
      // campId,
    });

    await Treatment.create({
      complaints,
      treatments: treatmentsSuggested,
      totalAmount: estimatedCost,
      remainingAmount: 0,
      paidAmount: 0,
      status: 'not started',
      diagnosisId: diagnosis.id,
    });
  };

  // Handle child selected teeth
  if (childSelectedTeeth.length > 0) {
    for (const tooth of childSelectedTeeth) {
      await createDiagnosisAndTreatment(tooth, 'child');
    }
  }

  // Handle adult selected teeth
  if (adultSelectedTeeth.length > 0) {
    for (const tooth of adultSelectedTeeth) {
      await createDiagnosisAndTreatment(tooth, 'adult');
    }
  }

  // Handle all dental quadrants
  if (dentalQuadrantType === 'all') {
    await createDiagnosisAndTreatment(null, 'all');
  }
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
  // Ensure selectedTeeth is NULL when empty, instead of an empty string
  const selectedTeeth =
    Array.isArray(updateBody?.selectedTeeth) && updateBody.selectedTeeth.length > 0
      ? updateBody.selectedTeeth[0] // Take first element if exists
      : null; // Otherwise, set to null

  const { complaints, treatmentsSuggested, dentalQuadrantType, xrayStatus, xray, notes, estimatedCost } = updateBody;

  const updatedDiagnosisBody = {
    complaints,
    treatmentsSuggested,
    selectedTeeth,
    dentalQuadrantType,
    xrayStatus,
    xray,
    notes,
    estimatedCost,
  };
  const newRemainingAmount = estimatedCost - treatments.paidAmount;
  const updatedTreatmentBody = {
    complaints,
    treatments: treatmentsSuggested,
    dentalQuadrantType,
    totalAmount: estimatedCost,
    remainingAmount: newRemainingAmount,
  };

  if (treatments.length > 0) {
    treatments.forEach(async (treatment) => {
      Object.assign(treatment, updatedTreatmentBody);
      await treatment.save();
    });
  }

  Object.assign(diagnosis, updatedDiagnosisBody);
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
    xrayStatus,
    crownStatus,
    xray,
    paymentStatus,
    onlineAmount,
    offlineAmount,
    treatingDoctor,
    nextDate,
    campId,
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
        totalAmount: diagnosis.estimatedCost,
        paidAmount: Number(onlineAmount) + Number(offlineAmount),
        remainingAmount: totalAmount - (Number(onlineAmount) + Number(offlineAmount)),
        paymentStatus,
        diagnosisId,
      });
    } else {
      let oldPaidAmount = treatment.paidAmount;
      treatment.paidAmount = Number(oldPaidAmount) + (Number(onlineAmount) + Number(offlineAmount));
      console.log(
        'treatment.paidAmount -->',
        treatment.paidAmount,
        Number(treatment.paidAmount) + Number(onlineAmount) + Number(offlineAmount),
        oldPaidAmount
      );
      treatment.remainingAmount =
        Number(treatment.totalAmount) - (Number(oldPaidAmount) + (Number(onlineAmount) + Number(offlineAmount)));
      console.log(
        'treatment.remainingAmount -->',
        treatment.remainingAmount,
        Number(treatment.totalAmount) - (Number(oldPaidAmount) + (Number(onlineAmount) + Number(offlineAmount)))
      );
      treatment.status = 'started';
      await treatment.save();
    }

    // Create an entry in TreatmentSetting linked to this treatment
    const treatmentSetting = await TreatmentSetting.create({
      treatmentDate,
      treatmentStatus,
      notes,
      xrayStatus,
      crownStatus,
      xray,
      treatingDoctor,
      onlineAmount,
      offlineAmount,
      nextDate,
      additionalDetails: treatmentBody.additionalDetails || {},
      treatmentId: treatment.id, // Associate with the found/created Treatment
      campId,
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
    xray,
    xrayStatus,
    crownStatus,
    treatingDoctor,
    onlineAmount,
    offlineAmount,
    nextDate,
    treatmentStatus,
    ...treatmentFields // Extract Treatment fields separately
  } = updateBody;

  let newSettingPaidAmount = 0;

  // Fetch Treatment by ID
  const treatment = await getTreatmentById(treatmentId);
  if (!treatment) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Treatment not found');
  }
  console.group('updateTreatment logs');
  console.log('treatmentFields -->', treatmentFields);
  // ✅ Update Treatment only if there are fields to update
  if (Object.keys(treatmentFields).length > 0) {
    // Ensure numeric fields are properly handled
    const validTreatmentFields = { ...treatmentFields };
    ['totalAmount', 'paidAmount', 'remainingAmount'].forEach((field) => {
      if (validTreatmentFields[field] !== undefined) {
        validTreatmentFields[field] = Number(validTreatmentFields[field]) || 0;
      }
    });

    console.info("validTreatmentFields['totalAmount'] -->", validTreatmentFields['totalAmount']);
    console.info("validTreatmentFields['paidAmount'] -->", validTreatmentFields['paidAmount']);
    console.info("validTreatmentFields['remainingAmount'] -->", validTreatmentFields['remainingAmount']);
    Object.assign(treatment, validTreatmentFields);
    await treatment.save();
  }

  let updatedTreatmentSetting = null;
  if (treatmentSettingId) {
    // If treatmentSettingId is provided, update the existing TreatmentSetting
    updatedTreatmentSetting = await TreatmentSetting.findByPk(treatmentSettingId);
    if (!updatedTreatmentSetting) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Treatment setting not found');
    }

    // update treatment paid amount and remianing amount if the online amoutn or offline amount is updated by checking its previous valuees
    if (Number(onlineAmount) !== Number(updatedTreatmentSetting.onlineAmount)) {
      console.log('first if', onlineAmount, typeof offlineAmount);
      newSettingPaidAmount += Number(onlineAmount) - Number(updatedTreatmentSetting.onlineAmount);
    }
    if (Number(offlineAmount) !== Number(updatedTreatmentSetting.offlineAmount)) {
      console.log('second if', offlineAmount, typeof offlineAmount);
      newSettingPaidAmount += Number(offlineAmount) - Number(updatedTreatmentSetting.offlineAmount);
    }

    Object.assign(updatedTreatmentSetting, {
      treatmentStatus,
      treatmentDate: settingTreatmentDate,
      notes: settingNotes,
      additionalDetails: settingAdditionalDetails,
      onlineAmount,
      offlineAmount,
      nextDate,
      xrayStatus,
      crownStatus,
      xray,
      treatingDoctor,
    });
    await updatedTreatmentSetting.save();

    console.log('newSettingPaidAmount -->', newSettingPaidAmount);
    // ✅ Recalculate Paid & Remaining Amounts for Treatment
    const totalPaidAmount = Number(treatment.paidAmount) + newSettingPaidAmount;
    const remainingAmount = Number(treatment.totalAmount) - totalPaidAmount;

    console.info('totalPaidAmount -->', totalPaidAmount);
    console.info('remainingAmount -->', remainingAmount);
    console.groupEnd();
    // ✅ Update Treatment's financial details
    treatment.paidAmount = totalPaidAmount;
    treatment.remainingAmount = remainingAmount <= 0 ? 0 : remainingAmount;

    // Ensure paymentStatus updates correctly
    treatment.paymentStatus = remainingAmount <= 0 ? 'paid' : 'pending';

    await treatment.save();
  }

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

const createMammography = async (patientId, mammographyBody) => {
  try {
    const existingMammo = await Mammography.findOne({ where: { patientId } });
    if (existingMammo) {
      await updateMammography(patientId, {
        ...mammographyBody,
        patientId,
      });
    }

    const {
      menstrualAge = null,
      numberOfPregnancies = null,
      numberOfDeliveries = null,
      numberOfLivingChildren = null,
      ...otherMammographyBody
    } = mammographyBody;

    const newMammographyBody = {
      menstrualAge: menstrualAge !== 'null' ? Number(menstrualAge) : null,
      numberOfPregnancies: numberOfPregnancies !== 'null' ? Number(numberOfPregnancies) : null,
      numberOfDeliveries: numberOfDeliveries !== 'null' ? Number(numberOfDeliveries) : null,
      numberOfLivingChildren: numberOfLivingChildren !== 'null' ? Number(numberOfLivingChildren) : null,
      patientId,
      ...otherMammographyBody,
    };

    console.log('new mammographyBody -->', newMammographyBody);

    const mammographyCreated = await Mammography.create(newMammographyBody);
    return mammographyCreated;
  } catch (error) {
    console.error(error);
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Error While Adding Mammography Details');
  }
};

const getMammographyById = async (patientId) => {
  try {
    const mammography = await Mammography.findOne({ where: { patientId } });
    if (!mammography) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Mammography record not found');
    }
    const patientDoc = await Patient.findByPk(patientId);

    return { ...mammography.dataValues, ...patientDoc.dataValues };
  } catch (error) {
    console.error(error);
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Error While Fetching Mammography Details');
  }
};

const updateMammography = async (patientId, updateBody) => {
  try {
    const mammography = await Mammography.findOne({ where: { patientId } });
    if (!mammography) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Mammography record not found');
    }

    const {
      menstrualAge = null,
      numberOfPregnancies = null,
      numberOfDeliveries = null,
      numberOfLivingChildren = null,
      ...otherUpdatedBody
    } = updateBody;

    const newMammographyBody = {
      menstrualAge: menstrualAge !== 'null' ? Number(menstrualAge) : null,
      numberOfPregnancies: numberOfPregnancies !== 'null' ? Number(numberOfPregnancies) : null,
      numberOfDeliveries: numberOfDeliveries !== 'null' ? Number(numberOfDeliveries) : null,
      numberOfLivingChildren: numberOfLivingChildren !== 'null' ? Number(numberOfLivingChildren) : null,
      ...otherUpdatedBody,
    };

    Object.assign(mammography, newMammographyBody);
    await mammography.save();
    return mammography;
  } catch (error) {
    console.error(error);
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Error While Updating Mammography Details');
  }
};

const deleteMammography = async (patientId) => {
  try {
    const mammography = await Mammography.findOne({ where: { patientId } });
    if (!mammography) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Mammography record not found');
    }
    await mammography.destroy();
    return { message: 'Mammography record deleted successfully' };
  } catch (error) {
    console.error(error);
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Error While Deleting Mammography Details');
  }
};

/**
 * Create a new GP record
 */
const createGPRecord = async (data) => {
  // const bmi = data.weight && data.height ? (data.weight / (data.height * data.height)).toFixed(2) : null;
  return GeneralPhysicianRecord.create(data);
};

/**
 * Get all GP records of a patient
 */
const getGPRecordsByPatient = async (patientId) => {
  return GeneralPhysicianRecord.findAll({ where: { patientId } });
};

/**
 * Get a single GP record by ID
 */
const getGPRecordById = async (id) => {
  return GeneralPhysicianRecord.findByPk(id);
};

/**
 * Update a GP record
 */
const updateGPRecord = async (id, updateData) => {
  const record = await GeneralPhysicianRecord.findByPk(id);
  if (!record) {
    throw new Error('General Physician Record not found');
  }

  // if (updateData.weight && updateData.height) {
  //   updateData.bmi = (updateData.weight / (updateData.height * updateData.height)).toFixed(2);
  // }

  return record.update(updateData);
};

/**
 * Delete a GP record
 */
const deleteGPRecord = async (id) => {
  return GeneralPhysicianRecord.destroy({ where: { id } });
};

/**
 * Get all patients with active follow-ups.
 * Active follow-ups are determined by checking if the follow-up date is in the future.
 * @returns {Promise<Array>} - List of patients with active follow-ups.
 */
const getPatientFollowUps = async (clinicId) => {
  console.log('clinicId -->', clinicId);
  const today = new Date();

  // Fetch patients with active follow-ups in TreatmentSetting
  const patientsWithActiveDentalFollowUps = await Patient.findAll({
    where: { clinicId },
    include: [
      {
        model: Diagnosis,
        as: 'diagnoses',
        include: [
          {
            model: Treatment,
            as: 'treatment',
            include: [
              {
                model: TreatmentSetting,
                as: 'treatmentSettings',
                where: {
                  nextDate: {
                    [Op.gt]: today, // Follow-up date is in the future
                  },
                },
                required: true,
              },
            ],
            required: true,
          },
        ],
        required: true,
      },
    ],
  });

  // Fetch patients with active follow-ups in GeneralPhysicianRecord
  const patientsWithActiveGPFollowUps = await Patient.findAll({
    include: [
      {
        model: GeneralPhysicianRecord,
        as: 'gpRecords',
        where: {
          followUpDate: {
            [Op.gt]: today, // Follow-up date is in the future
          },
        },
        required: true,
      },
    ],
  });

  // Add a service key to each patient indicating the follow-up service
  const patientsWithServiceKey = [
    ...patientsWithActiveDentalFollowUps.map((patient) => ({ ...patient.dataValues, service: 'Dentistry' })),
    ...patientsWithActiveGPFollowUps.map((patient) => ({ ...patient.dataValues, service: 'GP' })),
  ];

  return patientsWithServiceKey;
  // Combine the results and remove duplicates
  // const allPatients = [...patientsWithActiveDentalFollowUps, ...patientsWithActiveGPFollowUps];

  // const uniquePatients = allPatients.filter((patient, index, self) => index === self.findIndex((p) => p.id === patient.id));

  // return uniquePatients;
};

module.exports = {
  createPatient,
  searchPatients,
  deleteMammography,
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
  createMammography,
  updateMammography,
  getMammographyById,
  createGPRecord,
  getGPRecordsByPatient,
  getGPRecordById,
  updateGPRecord,
  deleteGPRecord,
  getPatientFollowUps,
};
