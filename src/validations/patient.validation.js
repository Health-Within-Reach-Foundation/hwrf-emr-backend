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
  body: Joi.object().keys({
    name: Joi.string().optional().trim(),
    age: Joi.number().integer().min(0).optional(),
    gender: Joi.string().valid('Male', 'Female', 'Other').optional(),
    mobile: Joi.string()
      .pattern(/^[0-9]{10}$/)
      .optional(),
    email: Joi.string().email().optional(),
    address: Joi.string().optional().allow(''),
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
    specialtyId: Joi.string().uuid().optional(), // specialtyId must be a valid UUID and is optional
  }),
};

module.exports = {
  createPatient,
  updatePatient,
  // getPatients,
  addDentalPatientRecord,
  getPatientsByClinic,
  getPatientById,
};
