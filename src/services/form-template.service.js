const { FormTemplate } = require('../models/form-template.model');
const ApiError = require('../utils/ApiError');
const httpStatus = require('http-status');

/**
 * Create a new form template
 * @param {Object} formTemplateBody - Form template data
 * @returns {Promise<FormTemplate>}
 */
const createFormTemplate = async (formTemplateBody, transaction = null) => {
  const { name, clinicId } = formTemplateBody;

  // Check for duplicate form template name within the same clinic
  const existingTemplate = await FormTemplate.findOne({
    where: { name, clinicId },
  });

  if (existingTemplate) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Form template with this name already exists in the clinic');
  }

  // Create the form template
  const formTemplate = await FormTemplate.create(formTemplateBody, { transaction });
  return formTemplate;
};

const getFormTemplateById = async (formTemplateId) => {
  const formTemplate = await FormTemplate.findByPk(formTemplateId);

  if (!formTemplate) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Form template not found');
  }

  return formTemplate;
};

const getAllFormTemplates = async (clinicId) => {
  const formTemplates = await FormTemplate.findAll({ where: { clinicId } });

  if (!formTemplates) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Form templates not found');
  }

  return formTemplates;
};

/**
 * Update an existing form template
 * @param {String} formTemplateId - ID of the form template to update
 * @param {Object} updateData - Updated data for the form template
 * @returns {Promise<FormTemplate>}
 */
const updateFormTemplate = async (formTemplateId, updateData) => {
  const { name, formData } = updateData;

  // Find the form template by ID
  const formTemplate = await FormTemplate.findByPk(formTemplateId);

  if (!formTemplate) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Form template not found');
  }

  // Update the name if provided
  if (name) {
    formTemplate.name = name;
  }

  // Update the formData if provided
  if (formData) {
    formTemplate.formData = formData;
  }

  // Save changes
  await formTemplate.save();
  return formTemplate;
};

/**
 * Delete a form template by ID
 * @param {String} formTemplateId
 * @returns {Promise<void>}
 */
const deleteFormTemplate = async (formTemplateId) => {
  const formTemplate = await FormTemplate.findByPk(formTemplateId);

  if (!formTemplate) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Form template not found');
  }

  await formTemplate.destroy({ force: true }); // Delete the form template
};

module.exports = {
  createFormTemplate,
  getFormTemplateById,
  getAllFormTemplates,
  updateFormTemplate,
  deleteFormTemplate,
};
