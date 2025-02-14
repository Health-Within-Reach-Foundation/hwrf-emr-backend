const { FormFields } = require('../models/form-fields.model');
const ApiError = require('../utils/ApiError');

/**
 * Create a form fields
 * @param {string} clinicId
 * @param {Object} formFieldsData
 * @returns {Promise<FormFields>}
 */
const createFormFields = async (clinicId, formFieldsData) => {
  return FormFields.create({ clinicId, ...formFieldsData });
};


/**
 * Get form fields by clinic id
 * @param {string} clinicId
 * @returns {Promise<FormFields>}
 */
const getAllFormFields = async (clinicId) => {
  return FormFields.findAll({ where: { clinicId } });
};

/**
 * Get form fields by id
 * @param {string} formFieldId
 * @returns {Promise<FormFields>}
 */
const getFormFieldById = async (formFieldId) => {
  return FormFields.findByPk(formFieldId);
};

/**
 * Update form fields by id but here I want update only formFieldData, check the object from formFieldsData comming from param check wheter the object and its key values are changed or not if changed then update it, try to use Object.assignof possible
 * @param {string} formFieldId
 * @param {Object} updateBody
 * @returns {Promise<FormFields>}
 */
const updateFormFieldById = async (formFieldId, updateBody) => {
  const formField = await getFormFieldById(formFieldId);
  if (!formField) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Form field not found');
  }
  Object.assign(formField, updateBody);
  await formField.save();
  return formField;
};

/**
 * Delete form fields by id
 * @param {string} formFieldId
 * @returns {Promise<FormFields>}
 */
const deleteFormFieldById = async (formFieldId) => {
  const formField = await getFormFieldById(formFieldId);
  if (!formField) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Form field not found');
  }
  await formField.destroy();
  return formField;
};

module.exports = {
  createFormFields,
  getAllFormFields,
  getFormFieldById,
  updateFormFieldById,
  deleteFormFieldById,
};
