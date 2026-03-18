const Joi = require('joi');
const { clinicStatusValidation } = require('./custom.validation');

/**
 * Validation schema for onboarding a clinic.
 */
const onboardClinic = {
  body: Joi.object({
    clinicName: Joi.string().required(),

    address: Joi.string().allow('', null).optional(),
    city: Joi.string().allow('', null).optional(),
    state: Joi.string().allow('', null).optional(),

    phoneNumber: Joi.string()
      .pattern(/^[0-9]{10,15}$/)
      .allow('', null)
      .optional(),

    contactEmail: Joi.string().email().allow('', null).optional(),

    website: Joi.string().uri().allow('', null).optional(),

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
  query: Joi.object({
    status: Joi.string().valid('active', 'pending', 'inactive').optional(),

    page: Joi.number().integer().positive().default(1),

    limit: Joi.number().integer().positive().default(10),

    sortBy: Joi.string().valid('createdAt', 'updatedAt', 'clinicName').default('createdAt'),

    order: Joi.string().valid('asc', 'desc').default('desc'),
  }),
};

/**
 * Validation schema for getting a clinic by ID.
 */
const getClinic = {
  params: Joi.object({
    clinicId: Joi.string().uuid().required(),
  }),
};

/**
 * Validation schema for getting a file by key.
 */
const getFileByKey = {
  query: Joi.object({
    key: Joi.string().required(),
  }),
};

/**
 * Validation schema for approving a clinic.
 */
const approveClinic = {
  params: Joi.object({
    clinicId: Joi.string().uuid().required(),
  }),

  body: Joi.object({
    status: Joi.string().custom(clinicStatusValidation).required(),
  }),
};

/**
 * Validation schema for creating a role.
 */
const createRole = {
  body: Joi.object({
    roleName: Joi.string().required(),
    roleDescription: Joi.string().allow('', null).optional(),
  }),
};

/**
 * Validation schema for updating a clinic by ID.
 */
const updateClinicById = {
  params: Joi.object({
    clinicId: Joi.string().uuid().required(),
  }),

  body: Joi.object({
    clinicName: Joi.string().optional(),

    address: Joi.string().allow('', null).optional(),
    city: Joi.string().allow('', null).optional(),
    state: Joi.string().allow('', null).optional(),

    phoneNumber: Joi.string()
      .pattern(/^[0-9]{10,15}$/)
      .allow('', null)
      .optional(),

    contactEmail: Joi.string().email().allow('', null).optional(),

    website: Joi.string().uri().allow('', null).optional(),

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
