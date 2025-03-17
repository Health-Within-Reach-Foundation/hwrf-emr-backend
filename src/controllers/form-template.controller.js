const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const { formTemplateService } = require('../services');

/**
 * Creates a new form template.
 *
 * @param {Object} req - The request object.
 * @param {Object} req.user - The user object.
 * @param {string} [req.user.clinicId] - The clinic ID associated with the user.
 * @param {Object} req.body - The body of the request containing form template data.
 * @param {Object} res - The response object.
 * @returns {Promise<void>} - A promise that resolves when the form template is created.
 */
const createFormTemplate = catchAsync(async (req, res) => {
  const clinicId = typeof req.user.clinicId === 'undefined' ? null : req.user.clinicId;
  const formTemplateBody = {
    ...req.body,
    clinicId,
  };
  const formTemplate = await formTemplateService.createFormTemplate(formTemplateBody);

  res.status(httpStatus.CREATED).json({
    success: true,
    message: 'Form template created successfully',
    data: formTemplate,
  });
});

/**
 * Get a form template by its ID.
 *
 * @param {Object} req - The request object.
 * @param {Object} req.params - The request parameters.
 * @param {string} req.params.formTemplateId - The ID of the form template to retrieve.
 * @param {Object} res - The response object.
 * @returns {Promise<void>} - A promise that resolves when the form template is retrieved and the response is sent.
 */
const getFormTemplateById = catchAsync(async (req, res) => {
  const { formTemplateId } = req.params;

  const formTemplate = await formTemplateService.getFormTemplateById(formTemplateId);

  res.status(httpStatus.OK).json({
    success: true,
    message: 'Form template fetched successfully',
    data: formTemplate,
  });
});

/**
 * Get all form templates.
 *
 * This function retrieves all form templates associated with the clinic of the authenticated user.
 * If the user's clinicId is undefined, it retrieves all form templates without filtering by clinic.
 *
 * @param {Object} req - Express request object.
 * @param {Object} req.user - Authenticated user object.
 * @param {string} [req.user.clinicId] - ID of the clinic associated with the user.
 * @param {Object} res - Express response object.
 * @returns {Promise<void>} - A promise that resolves to void.
 */
const getAllFormTemplates = catchAsync(async (req, res) => {
  const clinicId = typeof req.user.clinicId === 'undefined' ? null : req.user.clinicId;
  
  const formTemplates = await formTemplateService.getAllFormTemplates(clinicId);

  res.status(httpStatus.OK).json({
    success: true,
    message: 'All form templates',
    data: formTemplates,
  });
});

/**
 * Updates a form template.
 *
 * @param {Object} req - The request object.
 * @param {Object} req.params - The request parameters.
 * @param {string} req.params.formTemplateId - The ID of the form template to update.
 * @param {Object} req.body - The request body containing the updated form template data.
 * @param {Object} res - The response object.
 * @returns {Promise<void>} - A promise that resolves when the form template is updated.
 */
const updateFormTemplate = catchAsync(async (req, res) => {
  const { formTemplateId } = req.params;
  const updatedFormTemplate = await formTemplateService.updateFormTemplate(formTemplateId, req.body);

  res.status(httpStatus.OK).json({
    success: true,
    message: 'Form template updated successfully',
    data: updatedFormTemplate,
  });
});

/**
 * Deletes a form template by its ID.
 *
 * @param {Object} req - The request object.
 * @param {Object} req.params - The request parameters.
 * @param {string} req.params.formTemplateId - The ID of the form template to delete.
 * @param {Object} res - The response object.
 * @returns {Promise<void>} - A promise that resolves when the form template is deleted.
 */
const deleteFormTemplate = catchAsync(async (req, res) => {
  const { formTemplateId } = req.params;

  await formTemplateService.deleteFormTemplate(formTemplateId);

  res.status(httpStatus.NO_CONTENT).json({
    success: true,
    message: 'Form template deleted successfully',
  }); // Respond with 204 No Content
});

module.exports = {
  createFormTemplate,
  getFormTemplateById,
  getAllFormTemplates,
  updateFormTemplate,
  deleteFormTemplate,
  getAllFormTemplates,
};
