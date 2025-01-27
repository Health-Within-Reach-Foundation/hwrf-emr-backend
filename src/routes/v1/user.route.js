const express = require('express');
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const userValidation = require('../../validations/user.validation');
const { clinicController, userController } = require('../../controllers');

const router = express.Router();

router
  .route('/')
  .post(
    auth(),
    // roleAuthorization('administration:write'),
    validate(userValidation.createUser),
    userController.createClinicUser
  )
  .get(auth(), clinicController.getUsersByClinic)
  

router
.route('/:userId')
.get(
  auth(), // Authentication middleware
  validate(userValidation.getUserById), // Validation middleware
  userController.getUserById // Controller for fetching user details
)
.patch(
  auth(), // Authentication middleware
  validate(userValidation.updateUser), // Validation middleware
  userController.updateUser // Controller for updating user details
)
.delete(
  auth(),
  validate(userValidation.deleteUser),
  userController.deleteUser
)
;
module.exports = router;
