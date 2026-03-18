const Joi = require('joi');

/* ***************************** Patient CRUD Validation *************************** */

const createPatient = {
  body: Joi.object({
    name: Joi.string().required().trim(),
    age: Joi.number().integer().min(0).required(),
    sex: Joi.string().valid('male', 'female', 'other').required(),
    mobile: Joi.string()
      .pattern(/^[0-9]{10}$/)
      .required(),
    address: Joi.string().allow('').optional(),
    referral_source: Joi.string().allow('').optional(),
  }),
};

const updatePatient = {
  params: Joi.object({
    patientId: Joi.string().uuid().required(),
  }),
  body: Joi.object({
    name: Joi.string().trim().optional(),
    age: Joi.number().integer().min(0).optional(),
    sex: Joi.string().valid('male', 'female', 'other').optional(),
    mobile: Joi.string()
      .pattern(/^[0-9]{10}$/)
      .optional(),
    address: Joi.string().allow('').optional(),
    primaryDoctor: Joi.object({
      label: Joi.string().optional(),
      value: Joi.string().uuid().optional(),
      phoneNumber: Joi.string().optional(),
    }).optional(),
  }),
};

/**
 * PATIENT LIST WITH FILTERS
 */
const getPatientsByClinic = {
  query: Joi.object({
    limit: Joi.number().integer().min(1).max(200).default(50),
    offset: Joi.number().integer().min(0).default(0),

    name: Joi.string().allow('').optional(),
    address: Joi.string().allow('').optional(),
    service: Joi.string().allow('').optional(),
  }),
};

const getPatientsByClinicForExport = {
  query: Joi.object({
    maxRecords: Joi.number().integer().min(100).max(10000).default(10000),
  }),
};

const getPatientById = {
  params: Joi.object({
    patientId: Joi.string().uuid().required(),
  }),
  query: Joi.object({
    specialtyId: Joi.alternatives().try(Joi.string().uuid(), Joi.allow(null)).optional(),
  }),
};

const searchPatientsByClinic = {
  query: Joi.object({
    searchTerm: Joi.string().allow('').trim().max(100).optional(),
    limit: Joi.number().integer().min(1).max(100).default(10),
    offset: Joi.number().integer().min(0).default(0),
  }),
};

/* ***************************** Dental *************************** */

const addDentalPatientRecord = {
  body: Joi.object({
    appointmentId: Joi.string().uuid().required(),
    patientId: Joi.string().uuid().required(),
    complaints: Joi.array().items(Joi.string()).required(),
    treatment: Joi.array().items(Joi.string()).required(),
    dentalQuadrant: Joi.object()
      .pattern(/^[1-4]$/, Joi.array().items(Joi.number().integer().min(1).max(8)))
      .required(),
    xrayStatus: Joi.boolean().required(),
    xray: Joi.array().items(Joi.string().uri()).allow(null),
    notes: Joi.string().allow('', null),
    billing: Joi.object({
      totalCost: Joi.number().min(0).required(),
      paidAmount: Joi.number().min(0).required(),
      remainingAmount: Joi.number().min(0).required(),
    }),
  }),
};

/* ***************************** Diagnosis *************************** */

const createDiagnosis = {
  body: Joi.object({
    diagnosisDate: Joi.date().required(),
    complaints: Joi.array().items(Joi.string()).optional(),
    treatmentsSuggested: Joi.array().items(Joi.string()).optional(),
    currentStatus: Joi.array().items(Joi.string()).optional(),
    selectedTeeth: Joi.array().items(Joi.number()).optional(),
    childSelectedTeeth: Joi.array().items(Joi.number()).optional(),
    adultSelectedTeeth: Joi.array().items(Joi.number()).optional(),
    dentalQuadrantType: Joi.string().valid('adult', 'child', 'all').optional(),
    xrayStatus: Joi.boolean().optional(),
    notes: Joi.string().allow('', null).optional(),
    additionalDetails: Joi.object().optional(),
    patientId: Joi.string().uuid().required(),
    estimatedCost: Joi.number().optional(),
  }),
};

const getDiagnoses = {
  query: Joi.object({
    patientId: Joi.string().uuid().optional(),
  }),
};

const getDiagnosis = {
  params: Joi.object({
    diagnosisId: Joi.string().uuid().required(),
  }),
};

const updateDiagnosis = {
  params: Joi.object({
    diagnosisId: Joi.string().uuid().required(),
  }),
  body: Joi.object({
    diagnosisDate: Joi.date().optional(),
    complaints: Joi.array().items(Joi.string()).optional(),
    treatmentsSuggested: Joi.array().items(Joi.string()).optional(),
    selectedTeeth: Joi.array().items(Joi.number()).optional(),
    dentalQuadrantType: Joi.string().valid('adult', 'child', 'all').optional(),
    xrayStatus: Joi.boolean().optional(),
    notes: Joi.string().allow('', null).optional(),
    additionalDetails: Joi.object().optional(),
    patientId: Joi.string().uuid().optional(),
    estimatedCost: Joi.number().optional(),
  }),
};

const deleteDiagnosis = {
  params: Joi.object({
    diagnosisId: Joi.string().uuid().required(),
  }),
};

/* ***************************** Treatments *************************** */

const createTreatment = {
  body: Joi.object({
    diagnosisId: Joi.string().uuid().required(),
    treatmentDate: Joi.date().required(),
    treatmentStatus: Joi.array().items(Joi.string()).optional(),
    notes: Joi.string().allow('', null).optional(),
    totalAmount: Joi.number().required(),
    paidAmount: Joi.number().default(0),
    remainingAmount: Joi.number().required(),
    paymentStatus: Joi.string().valid('paid', 'pending').default('pending'),
    patientId: Joi.string().uuid().optional(),
    onlineAmount: Joi.number().optional(),
    offlineAmount: Joi.number().optional(),
    nextDate: Joi.date().allow(null).optional(),
  }),
};

const getTreatments = {
  query: Joi.object({
    diagnosisId: Joi.string().uuid().required(),
    page: Joi.number().integer().default(1),
    limit: Joi.number().integer().default(10),
  }),
};

const getTreatmentById = {
  params: Joi.object({
    treatmentId: Joi.string().uuid().required(),
  }),
};

const updateTreatment = {
  params: Joi.object({
    treatmentId: Joi.string().uuid().required(),
  }),
  body: Joi.object({
    patientId: Joi.string().uuid().optional(),
    notes: Joi.string().allow('', null).optional(),
    totalAmount: Joi.number().optional(),
    paidAmount: Joi.number().optional(),
    remainingAmount: Joi.number().optional(),
    paymentStatus: Joi.string().valid('paid', 'pending').optional(),
    onlineAmount: Joi.number().optional(),
    offlineAmount: Joi.number().optional(),
  }),
};

const deleteTreatment = {
  params: Joi.object({
    treatmentId: Joi.string().uuid().required(),
  }),
};

/* ***************************** Mammography *************************** */

const createMammography = {
  params: Joi.object({
    patientId: Joi.string().uuid().required(),
  }),
  body: Joi.object({
    menstrualAge: Joi.number().integer().min(0).allow(null).optional(),
    lastMenstrualDate: Joi.date().allow(null).optional(),
    cycleType: Joi.string().valid('Regular', 'Irregular').allow('', null).optional(),
    menopause: Joi.string().valid('Yes', 'No').allow('', null).optional(),
    familyHistory: Joi.string().valid('Yes', 'No').allow('', null).optional(),
    additionalInfo: Joi.string().allow('', null).optional(),
    reportStatus: Joi.string().valid('Normal', 'Abnormal').allow('', null).optional(),
    aiReportScore: Joi.number().allow('', null).optional(),
  }),
};

const getMammography = {
  params: Joi.object({
    patientId: Joi.string().uuid().required(),
  }),
};

const updateMammography = {
  body: Joi.object({
    menstrualAge: Joi.number().integer().min(0).allow(null).optional(),
    cycleType: Joi.string().valid('Regular', 'Irregular').allow('', null).optional(),
    menopause: Joi.string().valid('Yes', 'No').allow('', null).optional(),
    reportStatus: Joi.string().valid('Normal', 'Abnormal').allow('', null).optional(),
  }),
};

/* ***************************** GP *************************** */

const createGPRecord = {
  body: Joi.object({
    patientId: Joi.string().uuid().optional(),
    weight: Joi.number().allow('', null).optional(),
    height: Joi.number().allow('', null).optional(),
    sugar: Joi.number().allow('', null).optional(),
    bp: Joi.string().allow('', null).optional(),
    hb: Joi.number().allow('', null).optional(),
    treatment: Joi.string().allow('', null).optional(),
    advice: Joi.string().allow('', null).optional(),
    followUpDate: Joi.date().allow('', null).optional(),
    onlineAmount: Joi.number().allow('', null).optional(),
    offlineAmount: Joi.number().allow('', null).optional(),
  }),
};

const getGPRecordsByPatient = {
  query: Joi.object({
    patientId: Joi.string().uuid().required(),
  }),
};

const getGPRecord = {
  params: Joi.object({
    gpRecordId: Joi.string().uuid().required(),
  }),
};

const updateGPRecord = {
  params: Joi.object({
    gpRecordId: Joi.string().uuid().required(),
  }),
  body: Joi.object({
    weight: Joi.number().allow('', null).optional(),
    height: Joi.number().allow('', null).optional(),
    sugar: Joi.number().allow('', null).optional(),
    bp: Joi.string().allow('', null).optional(),
    hb: Joi.number().allow('', null).optional(),
  }).min(1),
};

/* ***************************** EXPORT *************************** */

module.exports = {
  createPatient,
  updatePatient,
  getPatientsByClinic,
  getPatientsByClinicForExport,
  searchPatientsByClinic,
  getPatientById,
  addDentalPatientRecord,
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
  getMammography,
  createMammography,
  updateMammography,
  createGPRecord,
  getGPRecordsByPatient,
  getGPRecord,
  updateGPRecord,
};
