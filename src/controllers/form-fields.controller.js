const catchAsync = require('../utils/catchAsync');
const { formFieldsService } = require('../services');
const httpStatus = require('http-status');
const ApiError = require('../utils/ApiError');

/**
 * Create form fields
 * @param {Object} req
 * @param {Object} res
 */
const createFormFields = catchAsync(async (req, res) => {
  const clinicId = req?.user?.clinicId || null;

  const formFields = await formFieldsService.createFormFields(clinicId, req.body);
  res.status(httpStatus.CREATED).json({
    data: formFields,
    message: 'Form fields created successfully',
    success: true,
  });
});

/**
 * Get all form fields
 * @param {Object} req
 * @param {Object} res
 */
const getAllFormFields = catchAsync(async (req, res) => {
  const clinicId = req?.user?.clinicId || null;
  const formFields = await formFieldsService.getAllFormFields(clinicId);
  res.status(httpStatus.OK).json({
    data: formFields,
    message: 'All form fields fetched successfully',
    success: true,
  });
});

/**
 * Get form fields options
 * @param {Object} req
 * @param {Object} res
 * @returns {Object}
 * @throws {Error}
 */
const getFormFieldsOptions = catchAsync(async (req, res) => {
  const clinicId = req?.user?.clinicId || null;
  const formFieldsOptions = await formFieldsService.getFormFieldsOptions(clinicId);
  res.status(httpStatus.OK).json({
    data: formFieldsOptions,
    message: 'All form fields fetched successfully',
    success: true,
  });
});

/**
 * Get form field by id
 * @param {Object} req
 * @param {Object} res
 */
const getFormFieldById = catchAsync(async (req, res) => {
  const formField = await formFieldsService.getFormFieldById(req.params.formFieldId);
  if (!formField) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Form field not found');
  }
  res.status(httpStatus.OK).json({
    data: formField,
    message: 'Form field fetched successfully',
    success: true,
  });
});

/**
 * Update form field by id
 * @param {Object} req
 * @param {Object} res
 */
const updateFormFieldById = catchAsync(async (req, res) => {
  const formField = await formFieldsService.updateFormFieldById(req.params.formFieldId, req.body);
  res.status(httpStatus.OK).json({
    data: formField,
    message: 'Form field updated successfully',
    success: true,
  });
});

/**
 * Update form field options
 * @param {Object} req
 * @param {Object} res
 */
const updateFormFieldOptions = catchAsync(async (req, res) => {
  const clinicId = req?.user?.clinicId || null;
  const { formId, fieldName, options } = req.body;
  const formFieldOptions = await formFieldsService.updateFormFieldOptions(clinicId, formId, fieldName, options);
  res.status(httpStatus.OK).json({
    data: formFieldOptions,
    message: 'Form field options updated successfully',
    success: true,
  });
});

/**
 * Delete form field by id
 * @param {Object} req
 * @param {Object} res
 */
const deleteFormFieldById = catchAsync(async (req, res) => {
  await formFieldsService.deleteFormFieldById(req.params.formFieldId);
  res.status(httpStatus.NO_CONTENT).json({
    message: 'Form field deleted successfully',
    success: true,
  });
});

module.exports = {
  createFormFields,
  getAllFormFields,
  getFormFieldsOptions,
  getFormFieldById,
  updateFormFieldById,
  updateFormFieldOptions,
  deleteFormFieldById,
};
