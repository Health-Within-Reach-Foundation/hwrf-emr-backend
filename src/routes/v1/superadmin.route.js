const express = require('express');
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const roleAuthorization = require('../../middlewares/role-authorise');
const { clinicValidation } = require('../../validations');
const { clinicController } = require('../../controllers');
const { patch } = require('./auth.route');

const router = express.Router();

router
  .route('/clinics')
  .get(
    auth(),
    roleAuthorization('superadmin'),
    validate(clinicValidation.queryOptionsValidation),
    clinicController.getClinics
  );

router
    .route('/approve-clinic/:clinicId')
    .patch(auth(), roleAuthorization('superadmin'), validate(clinicValidation.approveClinic),clinicController.approveClinic)

module.exports = router;
