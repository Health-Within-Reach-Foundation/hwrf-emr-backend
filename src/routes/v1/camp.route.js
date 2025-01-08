const express = require('express');
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const roleAuthorization = require('../../middlewares/role-authorise');
const { clinicValidation, userValidation, campValidation } = require('../../validations');
const { clinicController, userController, campController } = require('../../controllers');

const router = express.Router();

router
  .get('/', auth(), campController.getCamps)
  .post('/', auth(), validate(campValidation.createCamp), campController.createCamp);

module.exports = router;
