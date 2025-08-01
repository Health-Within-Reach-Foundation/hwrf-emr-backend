const Joi = require('joi');

/**
 * Validation schema for creating a form template.
 */
const createFormTemplate = {
  body: Joi.object().keys({
    name: Joi.string().required().description('Name of the form template'),
    formData: Joi.array()
      .items(
        Joi.object().keys({
          id: Joi.string().required().description('Unique identifier for the field'),
          type: Joi.string().valid('phone', 'text', 'textarea', 'radio', 'checkbox', 'select', 'date').required(),
          title: Joi.string().required(),
          value: Joi.string().allow('', null).optional(),
          options: Joi.array().items(Joi.string()).allow(null).optional(),
        })
      )
      .required()
      .description('Array of form fields with metadata'),
  }),
};

/**
 * Validation schema for getting a form template by ID.
 */
const getFormTemplateById = {
  params: Joi.object().keys({
    formTemplateId: Joi.string().uuid().required().description('Form Template ID'),
  }),
};

/**
 * Validation schema for updating a form template by ID.
 */
const updateFormTemplate = {
  params: Joi.object().keys({
    formTemplateId: Joi.string().uuid().required().description('Form Template ID'),
  }),
  body: Joi.object().keys({
    name: Joi.string().optional().description('Updated name of the form template'),
    formData: Joi.array()
      .items(
        Joi.object().keys({
          id: Joi.string().required().description('Unique identifier for the field'),
          type: Joi.string().valid('text', 'textarea', 'phone', 'radio', 'checkbox', 'select').required(),
          title: Joi.string().required().description('Field title'),
          value: Joi.string().allow('', null).optional().description('Field value'),
          options: Joi.array()
            .items(Joi.string())
            .allow(null)
            .optional()
            .description('Field options for select, radio, or checkbox'),
        })
      )
      .optional()
      .description('Updated array of form fields'),
  }),
};

/**
 * Validation schema for deleting a form template by ID.
 */
const deleteFormTemplate = {
  params: Joi.object().keys({
    formTemplateId: Joi.string().uuid().required().description('Form Template ID'),
  }),
};

module.exports = {
  createFormTemplate,
  getFormTemplateById,
  updateFormTemplate,
  deleteFormTemplate,
};
