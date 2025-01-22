const Joi = require('joi');

/**
 * Validation for adding a new patient
 */
const createPatient = {
  body: Joi.object().keys({
    name: Joi.string().required().trim(),
    age: Joi.number().integer().min(0).required(),
    sex: Joi.string().valid('male', 'female', 'other').required(),
    mobile: Joi.string()
      .pattern(/^[0-9]{10}$/) // Exactly 10 digits
      .required(),
    address: Joi.string().optional().allow(''), // Address is optional
  }),
};

/**
 * Validation for updating patient details
 */
const updatePatient = {
  params: Joi.object().keys({
    patientId: Joi.string().uuid().required(), // patientId must be a valid UUID and is required
  }),
  body: Joi.object().keys({
    name: Joi.string().optional().trim(),
    age: Joi.number().integer().min(0).optional(),
    sex: Joi.string().valid('male', 'female', 'other').optional(),
    mobile: Joi.string()
      .pattern(/^[0-9]{10}$/)
      .optional(),
    address: Joi.string().optional().allow(''),
    primaryDoctor: Joi.object()
      .keys({
        label: Joi.string().optional(),
        value: Joi.string().uuid().optional(),
        phoneNumber: Joi.string().optional(),
      })
      .optional(),
  }),
};

/**
 * Validation for fetching patients
 */
// const getPatients = {
//   query: Joi.object().keys({
//     name: Joi.string().optional(),
//     mobile: Joi.string().optional(),
//     registrationDate: Joi.date().optional(),
//     page: Joi.number().integer().min(1).default(1),
//     limit: Joi.number().integer().min(1).default(10),
//   }),
// };

const addDentalPatientRecord = {
  body: Joi.object().keys({
    appointmentId: Joi.string().uuid().required(),
    patientId: Joi.string().uuid().required(),
    complaints: Joi.array().items(Joi.string()).required(),
    treatment: Joi.array().items(Joi.string()).required(),
    dentalQuadrant: Joi.object()
      .pattern(
        /^[1-4]$/, // Keys must be 1, 2, 3, or 4 (valid quadrants)
        Joi.array().items(
          Joi.number().integer().min(1).max(8) // Teeth numbers must be 1-8
        )
      )
      .required(),
    xrayStatus: Joi.boolean().required(),
    xray: Joi.array().items(Joi.string().uri()).allow(null), // Image URLs
    notes: Joi.string().allow('', null), // Optional
    billing: Joi.object().keys({
      totalCost: Joi.number().min(0).required(),
      paidAmount: Joi.number().min(0).required(),
      remainingAmount: Joi.number().min(0).required(),
    }),
  }),
};

const getPatientsByClinic = {
  query: Joi.object().keys({
    clinicId: Joi.string().uuid().required(), // Clinic ID is required
    // page: Joi.number().integer().min(1).default(1),
    // limit: Joi.number().integer().min(1).default(10),
  }),
};

const getPatientById = {
  params: Joi.object().keys({
    patientId: Joi.string().uuid().required(), // patientId must be a valid UUID and is required
  }),
  query: Joi.object().keys({
    specialtyId: Joi.alternatives()
      .try(Joi.string().uuid(), Joi.allow(null)) // Allow either a UUID or null
      .optional(),
  }),
};

// const createDiagnosis = {
//   body: Joi.object().keys({
//     complaints: Joi.array().items(Joi.string()).optional(),
//     treatment: Joi.array().items(Joi.string()).optional(),
//     currentStatus: Joi.array().items(Joi.string()).optional(),
//     // dentalQuadrant: Joi.object().pattern(Joi.string(), Joi.array().items(Joi.number())).optional(),
//     dentalQuadrant: Joi.array().items(Joi.string()).optional(),
//     xrayStatus: Joi.boolean().optional(),
//     // xray: Joi.array().items(Joi.string().uri()).optional(),
//     notes: Joi.string().optional(),
//     additionalDetails: Joi.object().optional(),
//     // appointmentId: Joi.string().uuid().optional(),
//     patientId: Joi.string().uuid().required(),
//   }),
// };

//

const createDiagnosis = {
  body: Joi.object().keys({
    complaints: Joi.array().items(Joi.string()).optional(),
    treatmentsSuggested: Joi.array().items(Joi.string()).optional(),
    currentStatus: Joi.array().items(Joi.string()).optional(),
    // dentalQuadrant: Joi.array().items(Joi.string()).optional(),
    selectedTeeth: Joi.array().items(Joi.number()).optional(),
    dentalQuadrantType: Joi.string().valid('adult', 'child', 'all').optional(),
    xrayStatus: Joi.boolean().optional(),
    notes: Joi.string().allow('', null).optional(),
    additionalDetails: Joi.object().optional(),
    patientId: Joi.string().uuid().required(),
  }),
  files: (files) => {
    if (!files.length) return null; // No files, validation passes

    for (const file of files) {
      if (!['image/jpeg', 'image/png', 'application/pdf'].includes(file.mimetype)) {
        return `Invalid file type for file: ${file.originalname}. Only JPEG, PNG, or PDF files are allowed.`;
      }
      if (file.size > 5 * 1024 * 1024) {
        // 5 MB limit
        return `File ${file.originalname} exceeds the maximum size of 5MB.`;
      }
    }

    return null; // No errors
  },
};

const getDiagnoses = {
  query: Joi.object().keys({
    patientId: Joi.string().uuid().optional(),
    // page: Joi.number().integer().default(1),
    // limit: Joi.number().integer().default(10),
  }),
};

const getDiagnosis = {
  params: Joi.object().keys({
    diagnosisId: Joi.string().uuid().required(),
  }),
};

const updateDiagnosis = {
  params: Joi.object().keys({
    diagnosisId: Joi.string().uuid().required(),
  }),
  body: Joi.object().keys({
    complaints: Joi.array().items(Joi.string()).optional(),
    treatmentsSuggested: Joi.array().items(Joi.string()).optional(),
    // currentStatus: Joi.array().items(Joi.string()).optional(),
    selectedTeeth: Joi.array().items(Joi.number()).optional(),
    dentalQuadrantType: Joi.string().valid('adult', 'child', 'all').optional(),

    // dentalQuadrant: Joi.array().items(Joi.string()).optional(),
    xrayStatus: Joi.boolean().optional(),
    notes: Joi.string().allow('', null).optional(),
    additionalDetails: Joi.object().optional(),
  }),
  files: (files) => {
    if (!files.length) return null; // No files, validation passes

    for (const file of files) {
      if (!['image/jpeg', 'image/png', 'application/pdf', 'image/avif'].includes(file.mimetype)) {
        return `Invalid file type for file: ${file.originalname}. Only JPEG, PNG, or PDF files are allowed.`;
      }
      if (file.size > 5 * 1024 * 1024) {
        // 5 MB limit
        return `File ${file.originalname} exceeds the maximum size of 5MB.`;
      }
    }

    return null; // No errors
  },
};

const deleteDiagnosis = {
  params: Joi.object().keys({
    diagnosisId: Joi.string().uuid().required(),
  }),
};

const createTreatment = {
  body: Joi.object().keys({
    diagnosisId: Joi.string().uuid().required().description('Diagnosis ID'),
    treatmentDate: Joi.date().required().description('Date of treatment'),
    // complaints: Joi.array().items(Joi.string()).optional(),
    // treatment: Joi.array().items(Joi.string()).required(),
    // dentalQuadrant: Joi.object().pattern(Joi.string(), Joi.array().items(Joi.number())).optional(),
    // xrayStatus: Joi.boolean().optional(),
    // xray: Joi.array().items(Joi.string().uri()).optional(),
    treatmentStatus: Joi.array().items(Joi.string()).optional(),
    notes: Joi.string().allow('', null).optional(),
    additionalDetails: Joi.object().optional(),
    totalAmount: Joi.number().required(),
    paidAmount: Joi.number().default(0),
    remainingAmount: Joi.number().required(),
    paymentStatus: Joi.string().valid('paid', 'pending').default('pending'),
  }),
};

const getTreatments = {
  query: Joi.object().keys({
    diagnosisId: Joi.string().uuid().required().description('Diagnosis ID'),
    page: Joi.number().integer().default(1),
    limit: Joi.number().integer().default(10),
  }),
};

const getTreatmentById = {
  params: Joi.object().keys({
    treatmentId: Joi.string().uuid().required().description('Treatment ID'),
  }),
};

const updateTreatment = {
  params: Joi.object().keys({
    treatmentId: Joi.string().uuid().required().description('Treatment ID'),
  }),
  body: Joi.object()
    .keys({
      treatmentDate: Joi.date().optional(),
      // complaints: Joi.array().items(Joi.string()).optional(),
      // treatments: Joi.array().items(Joi.string()).optional(),
      // dentalQuadrant: Joi.object().pattern(Joi.string(), Joi.array().items(Joi.number())).optional(),
      // xrayStatus: Joi.boolean().optional(),
      // xray: Joi.array().items(Joi.string().uri()).optional(),
      treatmentStatus: Joi.array().items(Joi.string()).optional(),
      notes: Joi.string().allow('', null).optional(),
      additionalDetails: Joi.object().optional(),
      totalAmount: Joi.number().optional(),
      paidAmount: Joi.number().optional(),
      remainingAmount: Joi.number().optional(),
      paymentStatus: Joi.string().valid('paid', 'pending').optional(),
    })
    .min(1),
};

const deleteTreatment = {
  params: Joi.object().keys({
    treatmentId: Joi.string().uuid().required().description('Treatment ID'),
  }),
};

module.exports = {
  createPatient,
  updatePatient,
  // getPatients,
  addDentalPatientRecord,
  getPatientsByClinic,
  getPatientById,
  createDiagnosis,
  getDiagnoses,
  getDiagnosis,
  updateDiagnosis,
  deleteDiagnosis,
  createTreatment,
  getTreatments,
  getTreatmentById,
  updateTreatment,
  deleteTreatment,
};
