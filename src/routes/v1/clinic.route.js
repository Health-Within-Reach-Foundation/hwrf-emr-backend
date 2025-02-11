const express = require('express');
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const roleAuthorization = require('../../middlewares/role-authorise');
const { clinicValidation, userValidation, formTemplateValidation, formFieldsValidation } = require('../../validations');
const { clinicController, userController, formTemplateController, formFieldsController } = require('../../controllers');

const router = express.Router();

router.route('/specialities').get(auth(), clinicController.getSpecialtyDepartmentsByClinic);

router.route('/files').get(auth(), validate(clinicValidation.getFileByKey), clinicController.getFileByKey);

router
  .route('/form-template')
  .post(auth(), validate(formTemplateValidation.createFormTemplate), formTemplateController.createFormTemplate)
  .get(auth(), formTemplateController.getAllFormTemplates);

router
  .route('/form-template/:formTemplateId')
  .get(
    auth(), // Authentication middleware
    validate(formTemplateValidation.getFormTemplateById), // Validation for fetching form template
    formTemplateController.getFormTemplateById // Controller for fetching form template
  )
  .patch(
    auth(), // Authentication middleware
    validate(formTemplateValidation.updateFormTemplate), // Validation for update request
    formTemplateController.updateFormTemplate // Controller for updating form template
  )
  .delete(
    auth(), // Authentication middleware
    validate(formTemplateValidation.deleteFormTemplate), // Validation for deleting form template
    formTemplateController.deleteFormTemplate // Controller for deleting form template
  );

router
  .route('/form-fields')
  .post(auth(), validate(formFieldsValidation.createFormFields), formFieldsController.createFormFields)
  .get(auth(), formFieldsController.getAllFormFields);

router
  .route('/form-fields/:formFieldId')
  .get(auth(), validate(formFieldsValidation.getFormFieldById), formFieldsController.getFormFieldById)
  .patch(auth(), validate(formFieldsValidation.updateFormFieldById), formFieldsController.updateFormFieldById)
  .delete(auth(), validate(formFieldsValidation.deleteFormFieldById), formFieldsController.deleteFormFieldById);

router
  .route('/:clinicId')
  .get(
    // (req, res)=>{
    //   return res.status(204).send();
    // },
    auth(),
    // roleAuthorization('superadmin', 'admin'),
    validate(clinicValidation.getClinic),
    clinicController.getClinic
  )
  .patch(auth(), validate(clinicValidation.updateClinicById), clinicController.updateClinicById);
module.exports = router;
