const Joi = require('joi');

/**
 * Validation schema for creating a form field.
 */
const createFormFields = {
  body: Joi.object().keys({
    formName: Joi.string().required().description('Name of the form'),
    formFieldData: Joi.array().items(Joi.object()).required().description('Array of form fields with metadata'),
  }),
};

/**
 * Validation schema for getting a form field by ID.
 */
const getFormFieldById = {
  params: Joi.object().keys({
    formFieldId: Joi.string().uuid().required().description('Form Field ID'),
  }),
};

/**
 * Validation schema for updating a form field by ID.
 */
const updateFormFieldById = {
  params: Joi.object().keys({
    formFieldId: Joi.string().uuid().required().description('Form Field ID'),
  }),
  body: Joi.object().keys({
    formName: Joi.string().optional().description('Name of the form'),
    formFieldData: Joi.array().items(Joi.object()).optional().description('Array of form fields with metadata'),
  }),
};

/**
 * Validation schema for deleting a form field by ID.
 */
const deleteFormFieldById = {
  params: Joi.object().keys({
    formFieldId: Joi.string().uuid().required().description('Form Field ID'),
  }),
};


module.exports = {
  createFormFields,
  getFormFieldById,
  updateFormFieldById,
  deleteFormFieldById,
};
