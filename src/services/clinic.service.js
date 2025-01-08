const httpStatus = require('http-status');
const { userService, emailService, roleService } = require('.');
const { Clinic } = require('../models/clinic.model');
const ApiError = require('../utils/ApiError');
const { createRole } = require('./role.service');
const { Specialty } = require('../models/specialty.model');
const { Op } = require('sequelize');
const { User } = require('../models/user.model');
const { Role } = require('../models/role.model');

/**
 *
 * @param {Object} clinicBody
 * @returns {Promise<Clinic>}
 */
const createClinic = async (clinicBody) => {
  // console.log("clinicBody -->", clinicBody)
  // const isClinicExist = await Clinic.findOne({ where: { contactEmail: clinicBody.contactEmail } });

  // if (!isClinicExist) {
  //   throw new ApiError(httpStatus.BAD_REQUEST, 'Clinic with same contactEmail already taken');
  // }
  return Clinic.create(clinicBody);
};

/**
 *
 * @param {String} contactEmail
 * @param {String} phoneNumber
 * @returns {Promis<Clinic>}
 */

const getClinicByContactEmailPhoneNumber = async (contactEmail, phoneNumber) => {
  // If both contactEmail and phoneNumber are null, return null
  if (contactEmail === null && phoneNumber === null) {
    return null;
  }

  // Query to find clinic based on contactEmail or phoneNumber
  const clinic = await Clinic.findOne({
    where: {
      [Op.or]: [{ contactEmail }, { phoneNumber }],
    },
  });

  return clinic || null; // Return clinic if found, otherwise null
};

/**
 *
 * @param {String} clinicId
 * @returns {Promise<Clinic>}
 */
const getClinicById = async (clinicId) => {
  return Clinic.findByPk(clinicId);
};

/**
 * Fetches a list of clinics with associated users and specialties.
 * Supports pagination, filtering, and sorting.
 * @param {Object} queryOptions - Options for filtering, pagination, and sorting.
 * @param {string} queryOptions.status - Filter clinics by status (e.g., 'active', 'pending').
 * @param {number} queryOptions.page - The page number for pagination.
 * @param {number} queryOptions.limit - The number of records per page.
 * @param {string} queryOptions.sortBy - The column to sort by (e.g., 'createdAt').
 * @param {string} queryOptions.order - The order of sorting (asc or desc).
 * @returns {Promise<Object>} - A paginated list of clinics with associated data.
 */
const getClinics = async (queryOptions) => {
  const { status, sortBy = 'createdAt', order = 'desc' } = queryOptions;

  const where = {};
  if (status) {
    where.status = status;
  }

  const { rows: clinics, count: total } = await Clinic.findAndCountAll({
    where,
    order: [[sortBy, order.toUpperCase()]],
    attributes: { exclude: ['deletedAt'] },
    include: [
      {
        model: User,
        as: 'users',
        include: [
          {
            model: Role,
            as: 'roles',
            attributes: ['id', 'roleName'],
            through: { attributes: [] },
          },
        ],
      },
      {
        model: Specialty,
        as: 'specialties',
        attributes: ['id', 'name'],
        through: { attributes: [] },
      },
    ],
  });

  if (!clinics.length) {
    throw new ApiError(httpStatus.NOT_FOUND, 'No clinics found');
  }

  // Transform data
  const transformedData = clinics.map((clinic) => {
    const admin = clinic.users.find((user) => user.id === clinic.ownerId) || {};
    return {
      id: clinic.id,
      clinicName: clinic.clinicName,
      ownerName: admin.name || 'N/A',
      city: clinic.city || 'N/A',
      state: clinic.state || 'N/A',
      adminContactNumber: admin.phoneNumber || 'N/A',
      adminContactEmail: admin.email || 'N/A',
      specialties: clinic.specialties.map((spec) => spec.name).join(', ') || 'N/A',
      status: clinic.status,
      createdAt: clinic.createdAt,
    };
  });

  return {
    success: true,
    data: transformedData,
    meta: {
      total,
    },
  };
};

/**
 *
 * @param {String} clinicId
 * @param {Object} clinicBody
 * @return {Promise<Clinic>}
 */
const updateClinicById = async (clinicId, clinicBody) => {
  const clinic = await getClinicById(clinicId);

  if (!clinic) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Clinic not found');
  }

  Object.assign(clinic, clinicBody);

  await clinic.save();

  return clinic;
};

/**
 *
 * @param {String} clinicId
 *
 */
const removeClinicById = async (clinicId) => {
  const clinic = getClinicById(clinicId);
  if (!clinic) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Clinic not found');
  }

  (await clinic).destroy();
};

/**
 *
 * @param {Object} clinicData
 * @returns
 */
const onboardClinic = async (clinicData) => {
  const {
    clinicName,
    address = '',
    city = '',
    state = '',
    phoneNumber = '',
    contactEmail = '',
    website,
    specialties,
    adminName,
    adminEmail,
    adminPhoneNumber,
    password,
  } = clinicData;

  // console.log(roleService, userService);
  console.log(phoneNumber, contactEmail);
  // Step 1: Check if the clinic email already exists
  const existingClinic = await getClinicByContactEmailPhoneNumber(contactEmail, phoneNumber);
  if (existingClinic) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Clinic has already been registered!');
  }

  // Step 2: Check if the admin email already exists
  const existingAdmin = await userService.getUserByEmail(adminEmail);
  if (existingAdmin) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Admin email is already in use.');
  }

  // Step 3: Create the clinic first (so we can use its id for the admin user)
  //   const clinic = await Clinic.create({
  //     clinicName,
  //     address,
  //     city,
  //     state,
  //     phoneNumber,
  //     contactEmail,
  //   });
  const clinic = await createClinic({
    clinicName,
    address,
    city,
    state,
    phoneNumber,
    contactEmail,
  });

  // Step 4: Find the specialties in the database
  const specialtiesDoc = await Specialty.findAll({
    where: {
      id: {
        [Op.in]: specialties, // Check if the ID is in the array of specialties
      },
    },
  });

  if (!specialtiesDoc || specialtiesDoc.length !== specialties.length) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'One or more specialties not found');
  }

  // Step 5: Associate the specialties with the clinic in the junction table
  await clinic.addSpecialties(specialtiesDoc);

  // Step 4: Create the admin user with the correct clinicId after the clinic is created

  const admin = await userService.createUser({
    name: adminName,
    email: adminEmail,
    password: password,
    clinicId: clinic.id, // Assign clinicId to user after clinic is created
    phoneNumber: adminPhoneNumber,
  });

  // Step 5: Assign the role to the admin user (assuming there's an 'admin' role in your system)
  //   const adminRole = await Role.create({ roleName: 'admin', userId: admin.id });
  // await rolespermissionService.createRole({ roleName: 'admin', userId: admin.id, clinicId: clinic.id });

  // await roleService.createRole({ roleName: 'admin', userId: admin.id, clinicId: clinic.id });
  await createRole({ roleName: 'admin', userId: admin.id, clinicId: clinic.id }, admin);
  // await admin.addRoles(adminRole);

  // Step 6: Update the clinic's ownerId to the admin's UUID after user creation
  clinic.ownerId = admin.id;
  await clinic.save();

  // Send notification to superadmin
  await emailService.sendClinicOnboardingNotification({
    clinicName,
    contactEmail,
    adminName,
    address,
    city,
    state,
    adminEmail,
    clinicId: clinic.id,
  });

  return { clinic, admin };
};

const getClinic = async (clinicId) => {
  // Fetch clinic details by ID
  const clinic = await Clinic.findOne({
    where: { id: clinicId },
    attributes: { exclude: ['deletedAt'] },
    include: [
      {
        model: User,
        as: 'users',
        include: [
          {
            model: Role,
            as: 'roles',
            attributes: ['id', 'roleName'],
            through: { attributes: [] }, // Exclude junction table
          },
        ],
      },
      {
        model: Specialty,
        as: 'specialties',
        attributes: ['id', 'name'],
        through: { attributes: [] }, // Exclude junction table
      },
    ],
  });

  // Check if clinic exists
  if (!clinic) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Clinic not found');
  }

  // Transform data
  const admin = clinic.users.find((user) => user.id === clinic.ownerId) || {};
  const transformedData = {
    id: clinic.id,
    clinicName: clinic.clinicName,
    adminName: admin.name || 'N/A',
    address: clinic.address,
    city: clinic.city || 'N/A',
    state: clinic.state || 'N/A',
    clinicContactEmail: clinic.contactEmail,
    clinicPhoneNumber: clinic.phoneNumber,
    adminContactNumber: admin.phoneNumber || 'N/A',
    adminContactEmail: admin.email || 'N/A',
    specialties: clinic.specialties.map((spec) => spec.name).join(', ') || 'N/A',
    status: clinic.status,
    createdAt: clinic.createdAt,
    allUsers: clinic.users,
  };

  return {
    success: true,
    data: transformedData,
  };
};

const getSpecialtyDepartmentsByClinic = async (clinicId) => {
  // Fetch clinic along with associated specialties
  const clinic = await Clinic.findByPk(clinicId, {
    include: [
      {
        model: Specialty,
        as: 'specialties', // Alias defined in the association
        attributes: ['id', 'name', 'departmentName'], // Fetch only required columns
        through: { attributes: [] }, // Exclude junction table fields
      },
    ],
    attributes: ['id', 'clinicName'], // Clinic attributes to include in response
  });

  // Throw error if no clinic found
  if (!clinic) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Clinic not found');
  }

  return clinic.specialties; // Return the associated specialties
};

const createRoleUnderClinc = async (roleBody) => {
  return Role.create(roleBody);
};

const getRolesByClinic = async (clinicId) => {
  const clinicRoles = await Role.findAll({
    where: { clinicId },
    attributes: { exclude: ['deletedAt', 'createdAt', 'updatedAt'] },
  });

  return clinicRoles;
};


module.exports = {
  createClinic,
  getClinicById,
  getClinicByContactEmailPhoneNumber,
  getClinics,
  updateClinicById,
  removeClinicById,
  onboardClinic,
  getClinic,
  getSpecialtyDepartmentsByClinic,
  createRoleUnderClinc,
  getRolesByClinic,
};
