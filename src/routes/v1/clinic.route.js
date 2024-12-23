const express = require('express');
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const roleAuthorization = require('../../middlewares/role-authorise');
const { clinicValidation } = require('../../validations');
const { clinicController } = require('../../controllers');

const router = express.Router();

router
  .route('/:clinicId')
  .get(auth(), roleAuthorization('superadmin', 'admin'), validate(clinicValidation.getClinic), clinicController.getClinic);

module.exports = router;
