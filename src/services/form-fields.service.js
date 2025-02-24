const { FormFields } = require('../models/form-fields.model');
const ApiError = require('../utils/ApiError');

/**
 * Create a form fields
 * @param {string} clinicId
 * @param {Object} formFieldsData
 * @returns {Promise<FormFields>}
 */
const createFormFields = async (clinicId, formFieldsData, transaction = null) => {
  return FormFields.create({ clinicId, ...formFieldsData }, { transaction });
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
 * Get form fields options
 * @param {string} clinicId
 * @returns {Promise<FormFields>}
 */
const getFormFieldsOptions = async (clinicId) => {
  const formFields = await FormFields.findAll({ where: { clinicId } });

  const result = formFields.reduce((acc, formField) => {
    const { id, formName, formFieldData } = formField;
    acc[formName] = formFieldData.map((field) => ({
      id,
      fieldName: field.fieldName,
      type: field.type,
      options: field.options,
    }));
    return acc;
  }, {});

  return result;
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
 * Update form field options by clinic id and form field id
 * @param {string} clinicId
 * @param {string} formFieldId
 * @param {string} fieldName
 * @param {Array} options
 * @returns {Promise<FormFields>}
 */
const updateFormFieldOptions = async (clinicId, formId, fieldName, options) => {
  const formField = await FormFields.findOne({ where: { clinicId, id: formId } });
  if (!formField) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Form field not found');
  }

  const formFieldData = formField.formFieldData.map((field) => {
    if (field.fieldName === fieldName) {
      return { ...field, options };
    }
    return field;
  });

  formField.formFieldData = formFieldData;
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
  getFormFieldsOptions,
  getFormFieldById,
  updateFormFieldById,
  updateFormFieldOptions,
  deleteFormFieldById,
};
