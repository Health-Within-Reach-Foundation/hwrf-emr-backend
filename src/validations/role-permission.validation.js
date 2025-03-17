const Joi = require('joi');

/**
 * Validation schema for creating a role.
 */
const createRole = {
  body: Joi.object().keys({
    roleName: Joi.string().required().description('Name of the role'),
    roleDescription: Joi.string().optional().allow(null, '').default(null),
    permissions: Joi.array()
      .items(Joi.string().uuid().required().description('Permission ID'))
      .required()
      .description('Array of permissions for the role'),
  }),
};

/**
 * Validation schema for updating a role by ID.
 */
const updateRole = {
  query: Joi.object().keys({
    roleId: Joi.string().uuid().required(), // patientId must be a valid UUID and is required
  }),
  body: Joi.object().keys({
    roleName: Joi.string().required().description('Name of the role'),
    roleDescription: Joi.string().optional().allow(null, '').default(null),
    permissions: Joi.array()
      .items(Joi.string().uuid().required().description('Permission ID'))
      .required()
      .description('Array of permissions for the role'),
  }),
};

module.exports = {
  createRole,
  updateRole,
};
