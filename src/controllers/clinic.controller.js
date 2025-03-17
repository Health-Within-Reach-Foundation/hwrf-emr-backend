const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const { clinicService, userService, tokenService, emailService, formFieldsService } = require('../services');
const { getAllFormTemplates, createFormTemplate } = require('../services/form-template.service');
const { bulkCreateRole } = require('../services/role-permission.service');
const { Op } = require('sequelize');
const { Permission } = require('../models/permission.model');
const { tokenTypes } = require('../config/tokens');
const config = require('../config/config');
const sendEmailAzure = require('../services/email.azure.service');
const { getFile } = require('../utils/azure-service');
const db = require('../models');
const ApiError = require('../utils/ApiError');

/**
 * Get a list of clinics with pagination, filtering, and sorting
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
const getClinics = catchAsync(async (req, res) => {
  // Extract query parameters from the request
  const queryOptions = {
    status: req.query.status, // Filter by status (optional)
    // page: parseInt(req.query.page, 10) || 1, // Default to page 1
    // limit: parseInt(req.query.limit, 10) || 10, // Default to 10 records per page
    sortBy: req.query.sortBy || 'createdAt', // Default sorting column
    order: req.query.order || 'desc', // Default sorting order
  };

  // Call the service and get the structured response
  const clinicsResponse = await clinicService.getClinics(queryOptions);

  // Send the response directly from the service
  return res.status(httpStatus.OK).json(clinicsResponse);
});

const getClinic = catchAsync(async (req, res) => {
  const clinicResponse = await clinicService.getClinic(req.params.clinicId);

  return res.status(httpStatus.OK).json({
    message: 'Clinic found !',
    success: true,
    data: clinicResponse,
  });
});

const approveClinic = catchAsync(async (req, res) => {
  const transaction = await db.sequelize.transaction();
  try {
    const clinicResponse = await clinicService.updateClinicById(req.params.clinicId, req.body, transaction);

    const admin = await userService.getUserById(clinicResponse.ownerId);

    // update the status of admin
    admin.status = 'active';
    await admin.save({ transaction });

    // Replicating Templates
    const predefinedTemplates = await getAllFormTemplates(null);

    if (predefinedTemplates && Array.isArray(predefinedTemplates)) {
      for (const formTemplate of predefinedTemplates) {
        const { dataValues } = formTemplate; // Extract the actual data
        const { id, clinicId, createdAt, updatedAt, ...templateData } = dataValues; // Remove clinicId from dataValues
        console.log('Replicating template with new clinicId...');
        await createFormTemplate({ ...templateData, clinicId: clinicResponse.id }, transaction);
      }
    } else {
      console.warn('No predefined templates found or invalid response:', predefinedTemplates);
    }

    // Replicating the form fields

    const preDefinedFormFields = await formFieldsService.getAllFormFields(null);

    if (preDefinedFormFields && Array.isArray(preDefinedFormFields)) {
      for (const formField of preDefinedFormFields) {
        const { dataValues } = formField;
        const { id, clinicId, createdAt, updatedAt, ...fieldData } = dataValues;
        console.log('Replicating form field with new clinicId...');
        await formFieldsService.createFormFields(clinicResponse.id, { ...fieldData }, transaction);
      }
    }

    // Adding predefined roles for clinic and associated permissions
    const predefinedRole = [
      { roleName: 'admin', roleDescription: 'Has full access to all resources', clinicId: clinicResponse.id },
      { roleName: 'doctor', roleDescription: 'default role doctor', clinicId: clinicResponse.id },
      { roleName: 'dentist', roleDescription: 'default role dentist', clinicId: clinicResponse.id },
      { roleName: 'nurse', roleDescription: 'default role nurse', clinicId: clinicResponse.id },
      {
        roleName: 'outreach coordinator',
        roleDescription: 'default role outreach coordinator',
        clinicId: clinicResponse.id,
      },
      { roleName: 'finance', roleDescription: 'default role finance', clinicId: clinicResponse.id },
      { roleName: 'radiologist', roleDescription: 'default role radiologist', clinicId: clinicResponse.id },
      { roleName: 'radio technician', roleDescription: 'default role radio technician', clinicId: clinicResponse.id },
      { roleName: 'dental assistant', roleDescription: 'default role dental assistant', clinicId: clinicResponse.id },
    ];

    const defaultClinicRoles = await bulkCreateRole(predefinedRole, transaction);

    const adminRole = defaultClinicRoles.find((role) => role.roleName === 'admin');
    await admin.addRoles(adminRole, { transaction });

    const docotorPermission = [
      'queues:read',
      'queues:write',
      'camps:read',
      'camps:write',
      'patients:read',
      'patients:write',
    ];
    const predefinedDoctorPermissions = await Permission.findAll({
      where: {
        action: {
          [Op.in]: docotorPermission, // Match any of the given actions
        },
      },
      attributes: ['id', 'action'], // Fetch only necessary fields
    });

    const doctorRole = defaultClinicRoles.find((role) => role.roleName === 'doctor');
    await doctorRole.addPermissions(predefinedDoctorPermissions, { transaction }); // Sequelize method

    // Sending the link for setting account of admin
    const setPasswordToken = await tokenService.generatePasswordToken(admin.email, tokenTypes.SET_PASSWORD, transaction);

    const subject = 'Your Clinic Onboarding Request Has Been Approved - Set Your Password';

    const text = `Dear ${clinicResponse.clinicName},

Good news! Your clinic onboarding request has been approved.

To get started, please click the link below to set your admin password:

${config.client_domain}/auth/set-password/${setPasswordToken}

Once you've set your password, you'll have full access to manage your clinic account.

If you have any questions or need help, feel free to reach out to us at [contact email].

Thank You!

Best regards,
The HWRF Team`;

    await sendEmailAzure(admin.email, subject, text);
    await transaction.commit();

    return res.status(httpStatus.OK).json({
      success: true,
      message: 'Request approved! An email has been sent to the admin',
      data: clinicResponse,
    });
  } catch (error) {
    console.error('Error approving clinic:', error);
    await transaction.rollback();
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Error approving clinic');
  }
});

/**
 * Get all users associated with a clinic
 * @route GET /users/clinic
 * @access Admin (Clinic Level)
 */
const getUsersByClinic = catchAsync(async (req, res) => {
  // Extract clinicId from the logged-in admin's session or token
  const clinicId = req.user.clinicId;
  console.log('Checking the getUSersByClinic controller');
  // Fetch users from the service
  const users = await userService.getUsersByClinic(clinicId);

  // Send response
  res.status(httpStatus.OK).json({
    success: true,
    message: 'Users retrieved successfully.',
    data: users,
  });
});

const getSpecialtyDepartmentsByClinic = catchAsync(async (req, res) => {
  const clinicId = req.user.clinicId;

  const departments = await clinicService.getSpecialtyDepartmentsByClinic(clinicId);

  res.status(httpStatus.OK).json({
    success: true,
    data: departments,
    message: 'Specialties retrieved successfully.',
  });
});

const updateClinicById = catchAsync(async (req, res) => {
  const transaction = await db.sequelize.transaction();
  try {
    const { clinicId } = req.params;
    const updatedClinic = await clinicService.updateClinic(clinicId, req.body, transaction);
    await transaction.commit();
    res.status(httpStatus.OK).json({
      success: true,
      message: 'Clinic updated successfully',
      data: updatedClinic,
    });
  } catch (error) {
    console.error('Error updating clinic:', error);
    await transaction.rollback();
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Error updating clinic');
  }
});

const getFileByKey = catchAsync(async (req, res) => {
  const key = req.query.key;

  console.log('Key --.', key);

  await getFile(key, res);
});

module.exports = {
  getClinics,
  getClinic,
  approveClinic,
  getUsersByClinic,
  getSpecialtyDepartmentsByClinic,
  updateClinicById,
  getFileByKey,
  // createRole,
  // getRolesByClinic
};
