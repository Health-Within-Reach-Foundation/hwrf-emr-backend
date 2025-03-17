const express = require('express');
const validate = require('../../middlewares/validate');
const auth = require('../../middlewares/auth');
const { rolePermissionController, clinicController } = require('../../controllers');
const roleAuthorization = require('../../middlewares/role-authorise'); // Ensure correct middleware name
const { rolePermissionValidation } = require('../../validations');

const router = express.Router();

router
  .route('/')
  .post(
    auth(),
    // roleAuthorization('administration:write'), // Check if user can manage roles
    validate(rolePermissionValidation.createRole),
    rolePermissionController.createRole
  )
  .get(
    auth(),
    // roleAuthorization('administration:read'), // Allow only users with read or write permissions
    rolePermissionController.getRolesByClinic // Fetch roles and permissions
  )
  .patch(
    auth(),
    // roleAuthorization('administration:write'),
    (req, res, next) => {
      console.log('req body --------> ', req.body);
      next();
    },
    validate(rolePermissionValidation.updateRole),
    rolePermissionController.updateRole
  )
  ;


router
  .route('/all-permissions')
  .get(
    auth(),
    // roleAuthorization('administration:write'),
    // validate(role)
    rolePermissionController.getAllPermissions
  )

module.exports = router;
