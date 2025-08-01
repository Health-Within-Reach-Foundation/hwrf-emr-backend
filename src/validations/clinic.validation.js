const Joi = require('joi');
const { password, clinicStatusValidation } = require('./custom.validation');

/**
 * Validation schema for onboarding a clinic.
 */
const onboardClinic = {
  body: Joi.object().keys({
    clinicName: Joi.string().required(),
    // address: Joi.string().allow('', null).optional(), // Allow empty string or null
    // city: Joi.string().allow('', null).optional(), // Allow empty string or null
    // state: Joi.string().allow('', null).optional(), // Allow empty string or null
    phoneNumber: Joi.string()
      .pattern(/^[0-9]{10,15}$/)
      .allow('', null)
      .optional(), // Allow empty string or null
    contactEmail: Joi.string().email().allow('', null).optional(), // Allow empty string or null
    website: Joi.string().uri().optional(),
    specialties: Joi.array().items(Joi.string()).optional(),
    adminName: Joi.string().required(),
    adminEmail: Joi.string().required().email(),
    adminPhoneNumber: Joi.string()
      .required()
      .pattern(/^[0-9]{10,15}$/),
  }),
};

/**
 * Validation schema for querying clinics.
 */
const queryOptionsValidation = {
  query: Joi.object().keys({
    status: Joi.string()
      .valid('active', 'pending', 'inactive') // Add valid statuses
      .optional()
      .description('Filter clinics by status.'),
    // page: Joi.number()
    //   .integer()
    //   .positive()
    //   .default(1)
    //   .description('The page number for pagination. Default is 1.'),
    // limit: Joi.number()
    //   .integer()
    //   .positive()
    //   .default(10)
    //   .description('The number of records per page. Default is 10.'),
    sortBy: Joi.string()
      .valid('createdAt', 'updatedAt', 'clinicName')
      .default('createdAt')
      .description('The column to sort by. Default is createdAt.'),
    order: Joi.string()
      .valid('asc', 'desc')
      .default('desc')
      .description('The order of sorting (asc or desc). Default is desc.'),
  }),
};

/**
 * Validation schema for getting a clinic by ID.
 */
const getClinic = {
  params: Joi.object().keys({
    clinicId: Joi.string().uuid(),
  }),
};

/**
 * Validation schema for getting a file by key.
 */
const getFileByKey = {
  query: Joi.object().keys({
    key: Joi.string(),
  }),
};

/**
 * Validation schema for approving a clinic.
 */
const approveClinic = {
  params: Joi.object().keys({
    clinicId: Joi.string(),
  }),
  body: Joi.object().keys({
    status: Joi.string().custom(clinicStatusValidation),
  }),
};

/**
 * Validation schema for creating a role.
 */
const createRole = {
  body: Joi.object().keys({
    roleName: Joi.string().required(),
    roleDescription: Joi.string().optional(),
  }),
};

/**
 * Validation schema for updating a clinic by ID.
 */
const updateClinicById = {
  params: Joi.object().keys({
    clinicId: Joi.string().uuid().required(), // Clinic ID must be a valid UUID
  }),
  body: Joi.object().keys({
    clinicName: Joi.string().optional(),
    address: Joi.string().allow('', null).optional(),
    city: Joi.string().allow('', null).optional(),
    state: Joi.string().allow('', null).optional(),
    phoneNumber: Joi.string()
      .pattern(/^[0-9]{10,15}$/)
      .allow('', null)
      .optional(),
    contactEmail: Joi.string().email().allow('', null).optional(),
    status: Joi.string().valid('pending', 'active', 'inactive').optional(),
    specialties: Joi.array().items(Joi.string().uuid()).optional(),
  }),
};

module.exports = {
  onboardClinic,
  queryOptionsValidation,
  getClinic,
  approveClinic,
  createRole,
  updateClinicById,
  getFileByKey,
};
