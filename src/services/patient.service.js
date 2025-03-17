const { Op } = require('sequelize');
const { Patient } = require('../models/patient.model');
const { Appointment } = require('../models/appointment.model');
const { Queue } = require('../models/queue.model');
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
const createPatient = async (patientBody, transaction = null) => {
  return Patient.create(patientBody, { transaction });
};

/**
 *
 * @param {string} patientId
 * @returns {Promise<Patient>}
 */
const getPatientById = async (patientId) => {
  return Patient.findByPk(patientId);
};

/**
 * Get patients by clinic ID and optionally by camp ID.
 * @param {string} clinicId - The clinic ID.
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
 * @param {string} patientId - The ID of the patient to update.
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
 * @param {string} clinicId - The clinic ID.
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
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, `Internal Server Error: ${error?.message}`);
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
                order: [['treatmentDate', 'DESC']],
                separate: true,
              },
            ],
          },
        ],
        order: [['createdAt', 'DESC']], // Sort by creation date (latest first)
        separate: true,
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
        separate: true,
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

/**
 * Creates a diagnosis and associated treatment for a patient.
 *
 * @param {Object} diagnosisBody - The body of the diagnosis containing necessary details.
 * @param {Array} diagnosisBody.selectedTeeth - The selected teeth for the diagnosis.
 * @param {Array} diagnosisBody.childSelectedTeeth - The selected child teeth for the diagnosis.
 * @param {Array} diagnosisBody.adultSelectedTeeth - The selected adult teeth for the diagnosis.
 * @param {string} diagnosisBody.complaints - The complaints of the patient.
 * @param {Array} diagnosisBody.treatmentsSuggested - The suggested treatments for the patient.
 * @param {string} diagnosisBody.dentalQuadrantType - The type of dental quadrant.
 * @param {string} diagnosisBody.xrayStatus - The status of the x-ray.
 * @param {string} diagnosisBody.notes - Additional notes for the diagnosis.
 * @param {string} diagnosisBody.patientId - The ID of the patient.
 * @param {string} diagnosisBody.xray - The x-ray image or data.
 * @param {number} diagnosisBody.estimatedCost - The estimated cost of the treatment.
 * @throws {ApiError} If the patient is not found.
 */
const createDiagnosis = async (diagnosisBody, transaction = null) => {
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
    const diagnosis = await Diagnosis.create(
      {
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
      },
      { transaction }
    );

    await Treatment.create(
      {
        complaints,
        treatments: treatmentsSuggested,
        totalAmount: estimatedCost,
        remainingAmount: 0,
        paidAmount: 0,
        status: 'not started',
        diagnosisId: diagnosis.id,
      },
      { transaction }
    );
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

/**
 * Retrieves a paginated list of diagnoses for a specific patient.
 *
 * @param {Object} queryOptions - The query options for retrieving diagnoses.
 * @param {string} queryOptions.patientId - The ID of the patient to retrieve diagnoses for.
 * @param {number} [queryOptions.page=1] - The page number to retrieve.
 * @param {number} [queryOptions.limit=10] - The number of diagnoses to retrieve per page.
 * @returns {Promise<Object>} An object containing the diagnoses data and pagination metadata.
 * @returns {Array} return.data - The list of diagnoses.
 * @returns {Object} return.meta - The pagination metadata.
 * @returns {number} return.meta.total - The total number of diagnoses.
 * @returns {number} return.meta.page - The current page number.
 * @returns {number} return.meta.limit - The number of diagnoses per page.
 * @returns {number} return.meta.totalPages - The total number of pages.
 */
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

/**
 * Retrieves a diagnosis by its ID, including associated treatments and treatment settings.
 *
 * @param {string} diagnosisId - The ID of the diagnosis to retrieve.
 * @returns {Promise<Object>} The diagnosis object, including associated treatments and treatment settings.
 * @throws {ApiError} If the diagnosis is not found.
 */
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

/**
 * Updates a diagnosis and its associated treatments.
 *
 * @param {string} diagnosisId - The ID of the diagnosis to update.
 * @param {Object} updateBody - The body containing the updated diagnosis details.
 * @param {string[]} [updateBody.selectedTeeth] - The selected teeth for the diagnosis.
 * @param {string} [updateBody.complaints] - The complaints related to the diagnosis.
 * @param {string[]} [updateBody.treatmentsSuggested] - The treatments suggested for the diagnosis.
 * @param {string} [updateBody.dentalQuadrantType] - The type of dental quadrant.
 * @param {string} [updateBody.xrayStatus] - The status of the x-ray.
 * @param {string} [updateBody.xray] - The x-ray details.
 * @param {string} [updateBody.notes] - Additional notes for the diagnosis.
 * @param {number} [updateBody.estimatedCost] - The estimated cost of the diagnosis.
 * @returns {Promise<Object>} The updated diagnosis.
 */
const updateDiagnosis = async (diagnosisId, updateBody, transaction = null) => {
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
      await treatment.save({ transaction });
    });
  }

  Object.assign(diagnosis, updatedDiagnosisBody);
  await diagnosis.save({ transaction });
  return diagnosis;
};

/**
 * Deletes a diagnosis record by its ID.
 *
 * @param {number|string} diagnosisId - The ID of the diagnosis to be deleted.
 * @returns {Promise<void>} A promise that resolves when the diagnosis is deleted.
 */
const deleteDiagnosis = async (diagnosisId) => {
  const diagnosis = await getDiagnosisById(diagnosisId);
  await diagnosis.destroy({ force: true });
};

/**
 * Creates a treatment and its associated treatment setting.
 *
 * @param {Object} treatmentBody - The body of the treatment to be created.
 * @param {string} treatmentBody.diagnosisId - The ID of the diagnosis.
 * @param {Date} treatmentBody.treatmentDate - The date of the treatment.
 * @param {string} treatmentBody.treatmentStatus - The status of the treatment.
 * @param {string} treatmentBody.notes - Notes related to the treatment.
 * @param {number} treatmentBody.totalAmount - The total amount for the treatment.
 * @param {string} treatmentBody.xrayStatus - The status of the x-ray.
 * @param {string} treatmentBody.crownStatus - The status of the crown.
 * @param {string} treatmentBody.xray - The x-ray details.
 * @param {string} treatmentBody.paymentStatus - The payment status.
 * @param {number} treatmentBody.onlineAmount - The amount paid online.
 * @param {number} treatmentBody.offlineAmount - The amount paid offline.
 * @param {string} treatmentBody.treatingDoctor - The doctor treating the patient.
 * @param {Date} treatmentBody.nextDate - The next date for the treatment.
 * @param {string} treatmentBody.campId - The ID of the camp.
 * @param {Object} [treatmentBody.additionalDetails] - Additional details for the treatment.
 * @returns {Promise<Object>} The created treatment setting.
 * @throws {ApiError} If the diagnosis is not found or an internal server error occurs.
 */
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

/**
 * Retrieves a paginated list of treatments based on the provided diagnosis ID.
 *
 * @param {Object} params - The parameters for retrieving treatments.
 * @param {string} params.diagnosisId - The ID of the diagnosis to filter treatments.
 * @param {number} [params.page=1] - The page number for pagination (default is 1).
 * @param {number} [params.limit=10] - The number of treatments per page (default is 10).
 * @returns {Promise<Object>} An object containing the treatments, total count, current page, and total pages.
 * @returns {Array} return.treatments - The list of treatments.
 * @returns {number} return.total - The total number of treatments.
 * @returns {number} return.page - The current page number.
 * @returns {number} return.totalPages - The total number of pages.
 */
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

/**
 * Retrieves a treatment by its ID, including associated treatment settings and diagnosis.
 *
 * @param {number} treatmentId - The ID of the treatment to retrieve.
 * @returns {Promise<Object>} A promise that resolves to the treatment object if found.
 * @throws {ApiError} If the treatment is not found.
 */
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

  if (!treatment) throw new ApiError(httpStatus.NOT_FOUND, 'Treatment not found');
  return treatment;
};

/**
 * Updates a treatment and its associated treatment setting.
 *
 * @param {string} treatmentId - The ID of the treatment to update.
 * @param {Object} updateBody - The body containing fields to update.
 * @param {string} [updateBody.treatmentSettingId] - The ID of the treatment setting to update.
 * @param {Date} [updateBody.settingTreatmentDate] - The date of the treatment setting.
 * @param {string} [updateBody.settingNotes] - Notes for the treatment setting.
 * @param {string} [updateBody.settingAdditionalDetails] - Additional details for the treatment setting.
 * @param {string} [updateBody.xray] - X-ray information.
 * @param {string} [updateBody.xrayStatus] - Status of the X-ray.
 * @param {string} [updateBody.crownStatus] - Status of the crown.
 * @param {string} [updateBody.treatingDoctor] - The doctor treating the patient.
 * @param {number} [updateBody.onlineAmount] - The online amount for the treatment setting.
 * @param {number} [updateBody.offlineAmount] - The offline amount for the treatment setting.
 * @param {Date} [updateBody.nextDate] - The next date for the treatment.
 * @param {string} [updateBody.treatmentStatus] - The status of the treatment.
 * @param {Object} [updateBody.treatmentFields] - Additional fields to update in the treatment.
 * @param {number} [updateBody.treatmentFields.totalAmount] - The total amount for the treatment.
 * @param {number} [updateBody.treatmentFields.paidAmount] - The paid amount for the treatment.
 * @param {number} [updateBody.treatmentFields.remainingAmount] - The remaining amount for the treatment.
 * @throws {ApiError} If the treatment or treatment setting is not found.
 * @returns {Promise<Object>} The updated treatment and treatment setting.
 */
const updateTreatment = async (treatmentId, updateBody, transaction = null) => {
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
    await treatment.save({ transaction });
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
    await updatedTreatmentSetting.save({ transaction });

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

    await treatment.save({ transaction });
  }

  // ✅ Return updated treatment with the treatment setting
  return {
    treatment: await treatment.reload({ transaction }),
    treatmentSetting: updatedTreatmentSetting,
  };
};

/**
 * Deletes a treatment by its ID.
 *
 * @param {string} treatmentId - The ID of the treatment to delete.
 * @returns {Promise<void>} A promise that resolves when the treatment is deleted.
 */
const deleteTreatment = async (treatmentId) => {
  const treatment = await getTreatmentById(treatmentId);
  await treatment.destroy({ force: true });
};

/**
 * Creates a new mammography record for a patient or updates an existing one.
 *
 * @param {string} patientId - The ID of the patient.
 * @param {Object} mammographyBody - The body of the mammography data.
 * @param {string|number|null} [mammographyBody.menstrualAge=null] - The menstrual age of the patient.
 * @param {string|number|null} [mammographyBody.numberOfPregnancies=null] - The number of pregnancies the patient has had.
 * @param {string|number|null} [mammographyBody.numberOfDeliveries=null] - The number of deliveries the patient has had.
 * @param {string|number|null} [mammographyBody.numberOfLivingChildren=null] - The number of living children the patient has.
 * @param {Object} [mammographyBody.otherMammographyBody] - Other mammography data.
 * @returns {Promise<Object>} The created or updated mammography record.
 * @throws {ApiError} If there is an error while adding mammography details.
 */
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

/**
 * Retrieves a mammography record by patient ID.
 *
 * @param {string} patientId - The ID of the patient.
 * @returns {Promise<Object>} A promise that resolves to an object containing mammography and patient details.
 * @throws {ApiError} If the mammography record is not found or there is an error while fetching the details.
 */
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

/**
 * Updates the mammography record for a given patient.
 *
 * @param {string} patientId - The ID of the patient whose mammography record is to be updated.
 * @param {Object} updateBody - The body containing the updated mammography details.
 * @param {number|string|null} [updateBody.menstrualAge=null] - The menstrual age of the patient.
 * @param {number|string|null} [updateBody.numberOfPregnancies=null] - The number of pregnancies the patient has had.
 * @param {number|string|null} [updateBody.numberOfDeliveries=null] - The number of deliveries the patient has had.
 * @param {number|string|null} [updateBody.numberOfLivingChildren=null] - The number of living children the patient has.
 * @param {Object} [updateBody.otherUpdatedBody] - Any other fields to be updated in the mammography record.
 * @returns {Promise<Object>} The updated mammography record.
 * @throws {ApiError} If the mammography record is not found or if there is an error while updating the record.
 */
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

/**
 * Deletes a mammography record for a given patient ID.
 *
 * @param {string} patientId - The ID of the patient whose mammography record is to be deleted.
 * @returns {Promise<Object>} - A promise that resolves to an object containing a success message.
 * @throws {ApiError} - Throws an error if the mammography record is not found or if there is an internal server error.
 */
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
 * Creates a new General Physician Record.
 *
 * @param {string} data - The data for the new General Physician Record.
 * @param {number} [data.weight] - The weight of the patient (optional).
 * @param {number} [data.height] - The height of the patient (optional).
 * @returns {Promise<Object>} The created General Physician Record.
 */
const createGPRecord = async (data) => {
  // const bmi = data.weight && data.height ? (data.weight / (data.height * data.height)).toFixed(2) : null;
  return GeneralPhysicianRecord.create(data);
};

/**
 * Retrieves all General Physician records for a given patient.
 *
 * @param {string} patientId - The ID of the patient whose records are to be retrieved.
 * @returns {Promise<Array>} A promise that resolves to an array of General Physician records.
 */
const getGPRecordsByPatient = async (patientId) => {
  return GeneralPhysicianRecord.findAll({ where: { patientId } });
};

/**
 * Retrieves a General Physician Record by its primary key (ID).
 *
 * @param {string} id - The ID of the General Physician Record to retrieve.
 * @returns {Promise<Object|null>} A promise that resolves to the General Physician Record if found, or null if not found.
 */
const getGPRecordById = async (id) => {
  return GeneralPhysicianRecord.findByPk(id);
};

/**
 * Updates a General Physician Record with the given data.
 *
 * @param {string} id - The ID of the General Physician Record to update.
 * @param {Object} updateData - The data to update the General Physician Record with. The height of the patient (optional).
 * @returns {Promise<Object>} The updated General Physician Record.
 * @throws {ApiError} If the General Physician Record is not found.
 */
const updateGPRecord = async (id, updateData) => {
  const record = await GeneralPhysicianRecord.findByPk(id);
  if (!record) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Record not found');
  }

  return record.update(updateData);
};

/**
 * Deletes a General Physician Record by its ID.
 *
 * @param {string} id - The ID of the General Physician Record to delete.
 * @returns {Promise<number>} - The number of records deleted.
 */
const deleteGPRecord = async (id) => {
  return GeneralPhysicianRecord.destroy({ where: { id } });
};

/**
 * Fetches patients with active follow-ups in both TreatmentSetting and GeneralPhysicianRecord.
 *
 * @param {string} clinicId - The ID of the clinic to fetch patients for.
 * @returns {Promise<Array<Object>>} A promise that resolves to an array of patient objects with an added service key indicating the follow-up service.
 *
 * @async
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
                    [Op.gte]: today, // Follow-up date is today or in the future
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

  // Flatten the patient list for dental follow-ups
  const flattenedDentalFollowUps = patientsWithActiveDentalFollowUps.flatMap((patient) =>
    patient.diagnoses.flatMap((diagnosis) =>
      diagnosis.treatment.treatmentSettings.map((setting) => ({
        ...patient.dataValues,
        nextDate: setting.nextDate,
        service: 'Dentistry',
      }))
    )
  );

  // Fetch patients with active follow-ups in GeneralPhysicianRecord
  const patientsWithActiveGPFollowUps = await Patient.findAll({
    where: { clinicId },
    include: [
      {
        model: GeneralPhysicianRecord,
        as: 'gpRecords',
        where: {
          followUpDate: {
            [Op.gte]: today, // Follow-up date is today or in the future
          },
        },
        required: true,
      },
    ],
  });

  // Flatten the patient list for GP follow-ups
  const flattenedGPFollowUps = patientsWithActiveGPFollowUps.flatMap((patient) =>
    patient.gpRecords.map((record) => ({
      ...patient.dataValues,
      nextDate: record.followUpDate,
      service: 'GP',
    }))
  );

  // Combine the results
  const patientsWithServiceKey = [...flattenedDentalFollowUps, ...flattenedGPFollowUps];

  return patientsWithServiceKey;
};

module.exports = {
  createPatient,
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
