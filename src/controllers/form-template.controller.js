const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const { formTemplateService } = require('../services');

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

const getFormTemplateById = catchAsync(async (req, res) => {
  const { formTemplateId } = req.params;

  const formTemplate = await formTemplateService.getFormTemplateById(formTemplateId);

  res.status(httpStatus.OK).json({
    success: true,
    message: 'Form template fetched successfully',
    data: formTemplate,
  });
});

const getAllFormTemplates = catchAsync(async (req, res) => {
  const clinicId = typeof req.user.clinicId === 'undefined' ? null : req.user.clinicId;
  
  const formTemplates = await formTemplateService.getAllFormTemplates(clinicId);

  res.status(httpStatus.OK).json({
    success: true,
    message: 'All form templates',
    data: formTemplates,
  });
});

const updateFormTemplate = catchAsync(async (req, res) => {
  const { formTemplateId } = req.params;
  const updatedFormTemplate = await formTemplateService.updateFormTemplate(formTemplateId, req.body);

  res.status(httpStatus.OK).json({
    success: true,
    message: 'Form template updated successfully',
    data: updatedFormTemplate,
  });
});

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
