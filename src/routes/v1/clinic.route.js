const express = require('express');
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const roleAuthorization = require('../../middlewares/role-authorise');
const { clinicValidation, userValidation, formTemplateValidation } = require('../../validations');
const { clinicController, userController, formTemplateController } = require('../../controllers');

const router = express.Router();

router.route('/specialities').get(auth(), clinicController.getSpecialtyDepartmentsByClinic);


router
  .route('/form-template')
  .post(
    auth(),
    validate(formTemplateValidation.createFormTemplate),
    formTemplateController.createFormTemplate
  )
  .get(
    auth(),
    formTemplateController.getAllFormTemplates
  )

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
  )  

  
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
  );
module.exports = router;
