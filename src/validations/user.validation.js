const Joi = require('joi');
const { password, role } = require('./custom.validation');

const createUser = {
  body: Joi.object().keys({
    email: Joi.string().required().email(),
    password: Joi.string().custom(password).optional(),
    name: Joi.string().required(),
    roles: Joi.array().items(Joi.string()).optional(),
    phoneNumber: Joi.string().optional(),
    specialties: Joi.array().items(Joi.string()).optional().allow(null),
  }),
};

const getUsers = {
  query: Joi.object().keys({
    name: Joi.string(),
    role: Joi.string(),
    sortBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
  }),
};

const getUserById = {
  params: Joi.object().keys({
    userId: Joi.string().uuid().required().description('User ID'), // User ID must be a valid UUID
  }),
};

const updateUser = {
  params: Joi.object().keys({
    userId: Joi.string().uuid().required().description('User ID'),
  }),
  body: Joi.object().keys({
    name: Joi.string().optional().description('User name'),
    email: Joi.string().email().optional().description('User email'),
    phoneNumber: Joi.string().optional().description('Phone number'),
    roles: Joi.array()
      .items(Joi.string().uuid().required().description('Role ID'))
      .optional()
      .description('Updated roles for the user'),
    specialties: Joi.array()
      .items(Joi.string().uuid().required().description('Specialty ID'))
      .optional()
      .allow(null)
      .description('Updated specialties for the user'),
  }),
};

const deleteUser = {
  params: Joi.object().keys({
    userId: Joi.string().uuid().required().description('User ID'),
  }),
};

module.exports = {
  createUser,
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
};
