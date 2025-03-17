const Joi = require('joi');

/**
 * Validation schema for creating a camp.
 */
const createCamp = {
  body: Joi.object().keys({
    name: Joi.string().required(),
    location: Joi.string().allow('', null).optional(), // Allow empty string or null
    city: Joi.string().allow('', null).optional(), // Allow empty string or null
    startDate: Joi.date().optional(),
    endDate: Joi.date().optional(),
    specialties: Joi.array().items(Joi.string()).optional(),
    vans: Joi.array().items(Joi.string()).optional(),
    users: Joi.array().items(Joi.string()).optional(),
  }),
};

/**
 * Validation schema for getting a camp by ID.
 */
const getCampById = {
  params: Joi.object().keys({
    campId: Joi.string().uuid().required(),
  }),
};

/**
 * Validation schema for updating a camp by ID.
 */
const updateCampById = {
  params: Joi.object().keys({
    campId: Joi.string().uuid().required(), // Validate campId as UUID
  }),
  body: Joi.object().keys({
    name: Joi.string().optional(),
    location: Joi.string().allow('', null).optional(), // Allow empty string or null
    city: Joi.string().allow('', null).optional(), // Allow empty string or null
    startDate: Joi.date().optional(),
    endDate: Joi.date().optional(),
    specialties: Joi.array().items(Joi.string().uuid()).optional(),
    vans: Joi.array().items(Joi.string()).optional(),
    users: Joi.array().items(Joi.string().uuid()).optional(),
  }),
};

module.exports = {
  createCamp,
  getCampById,
  updateCampById,
};
