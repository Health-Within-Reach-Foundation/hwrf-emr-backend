const Joi = require('joi');
// const { password, clinicStatusValidation } = require('./custom.validation');

const createCamp = {
  body: Joi.object().keys({
    name: Joi.string().required(),
    location: Joi.string().allow('', null).optional(), // Allow empty string or null
    city: Joi.string().allow('', null).optional(), // Allow empty string or null
    startDate: Joi.date().optional(),
    endDate: Joi.date().optional(),
    specialties: Joi.array().items(Joi.string()).optional(),
    users: Joi.array().items(Joi.string()).optional(),
  }),
};

const getCampById = {
  params: Joi.object().keys({
    campId: Joi.string().uuid().required(),
  }),
};

module.exports = {
  createCamp,
  getCampById,
};
