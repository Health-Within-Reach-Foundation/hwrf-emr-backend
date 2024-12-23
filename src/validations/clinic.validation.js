const Joi = require('joi');
const { password, clinicStatusValidation } = require('./custom.validation');

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
    password: Joi.string().required().custom(password),
  }),
};

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

const getClinic = {
  params: Joi.object().keys({
    clinicId: Joi.string(),
  }),
};

const approveClinic = {
  params: Joi.object().keys({
    clinicId: Joi.string(),
  }),
  body: Joi.object().keys({
    status: Joi.string().custom(clinicStatusValidation),
  }),
};

module.exports = {
  onboardClinic,
  queryOptionsValidation,
  getClinic,
  approveClinic,
};
