const httpStatus = require('http-status');
const { userService, emailService } = require('.');
const { Clinic } = require('../models/clinic.model');
const ApiError = require('../utils/ApiError');
const { Specialty } = require('../models/specialty.model');
const { Op } = require('sequelize');
const { User } = require('../models/user.model');
const { Role } = require('../models/role.model');
const { bulkCreateRole } = require('./role-permission.service');
const { getAllFormTemplates, createFormTemplate } = require('./form-template.service');
const { Permission } = require('../models/permission.model');

/**
 *
 * @param {Object} clinicBody
 * @returns {Promise<Clinic>}
 */
const createClinic = async (clinicBody) => {
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
      [Op.and]: [{ contactEmail }, { phoneNumber }],
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

  return clinic.reload();
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
 * Fetches clinic details by clinic ID.
 *
 * @param {number} clinicId - The ID of the clinic to fetch.
 * @returns {Promise<Object>} The transformed clinic data.
 * @throws {ApiError} If the clinic is not found.
 */
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
        attributes: ['id', 'name', 'departmentName'],
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
    // specialties: clinic.specialties.map((spec) => spec.name).join(', ') || 'N/A',
    specialties: clinic.specialties || 'N/A',
    status: clinic.status,
    createdAt: clinic.createdAt,
    allUsers: clinic.users,
  };

  return transformedData;
};

/**
 * Fetches the specialty departments associated with a specific clinic.
 *
 * @param {number} clinicId - The ID of the clinic to fetch specialties for.
 * @returns {Promise<Array>} - A promise that resolves to an array of specialties associated with the clinic.
 * @throws {ApiError} - Throws an error if the clinic is not found.
 */
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


/**
 * Update a clinic by ID
 * @param {string} clinicId - ID of the clinic to update
 * @param {Object} clinicData - Data to update the clinic
 * @returns {Promise<Clinic>}
 */
const updateClinic = async (clinicId, clinicData) => {
  const { clinicName, address, city, state, phoneNumber, contactEmail, status, specialties } = clinicData;

  // Find existing clinic
  const clinic = await Clinic.findByPk(clinicId);
  if (!clinic) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Clinic not found');
  }

  // Update basic clinic details
  await updateClinicById(clinicId, {
    clinicName,
    address,
    city,
    state,
    phoneNumber,
    contactEmail,
    status,
  });
  // await clinic.update();

  // Handle Specialties (Many-to-Many)
  if (specialties) {
    const specialtyRecords = await Specialty.findAll({
      where: { id: { [Op.in]: specialties } },
    });

    if (specialtyRecords.length !== specialties.length) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'One or more specialties not found');
    }

    await clinic.setSpecialties(specialtyRecords); // Updates clinic specialties
  }

  return clinic.reload(); // Return updated clinic with relations
};

/**
 * Onboards a new clinic and its admin.
 *
 * @param {Object} clinicData - The data for the new clinic.
 * @param {string} clinicData.clinicName - The name of the clinic.
 * @param {string} [clinicData.address=''] - The address of the clinic.
 * @param {string} [clinicData.city=''] - The city where the clinic is located.
 * @param {string} [clinicData.state=''] - The state where the clinic is located.
 * @param {string} [clinicData.phoneNumber=''] - The phone number of the clinic.
 * @param {string} clinicData.contactEmail - The contact email of the clinic.
 * @param {string} clinicData.website - The website of the clinic.
 * @param {Array<number>} clinicData.specialties - The specialties of the clinic.
 * @param {string} clinicData.adminName - The name of the clinic admin.
 * @param {string} clinicData.adminEmail - The email of the clinic admin.
 * @param {string} clinicData.adminPhoneNumber - The phone number of the clinic admin.
 * @param {string} [clinicData.password='TzR6!wS@7bH9'] - The password for the clinic admin.
 * @returns {Promise<Object>} The created clinic and admin.
 * @throws {ApiError} If the clinic or admin email already exists.
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
    password = 'TzR6!wS@7bH9',
  } = clinicData;

  const existingClinic = await getClinicByContactEmailPhoneNumber(contactEmail, phoneNumber);
  if (existingClinic) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Clinic has already been registered!');
  }

  // Step 2: Check if the admin email already exists
  const existingAdmin = await userService.getUserByEmail(adminEmail);
  if (existingAdmin) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Admin email is already in use.');
  }

  const clinic = await createClinic({
    clinicName,
    address,
    city,
    state,
    phoneNumber,
    contactEmail,
  });

  const specialtiesDoc = await Specialty.findAll({
    where: {
      id: {
        [Op.in]: specialties, // Check if the ID is in the array of specialties
      },
    },
  });

  await clinic.addSpecialties(specialtiesDoc);

  const admin = await userService.createUser({
    name: adminName,
    email: adminEmail,
    password: password,
    clinicId: clinic.id, // Assign clinicId to user after clinic is created
    phoneNumber: adminPhoneNumber,
  });

  clinic.ownerId = admin.id;
  await clinic.save();

  return { clinic, admin };
};

module.exports = {
  createClinic,
  getClinicById,
  getClinicByContactEmailPhoneNumber,
  getClinics,
  updateClinicById,
  removeClinicById,
  getClinic,
  getSpecialtyDepartmentsByClinic,
  updateClinic,
  onboardClinic
};
