const httpStatus = require('http-status');
const { userService, emailService, roleService } = require('.');
const { Clinic } = require('../models/clinic.model');
const ApiError = require('../utils/ApiError');
const { createRole } = require('./role.service');
const { Specialty } = require('../models/specialty.model');
const { Op } = require('sequelize');
const { User } = require('../models/user.model');
const { Role } = require('../models/role.model');
const { Camp } = require('../models/camp.model');
const { Appointment } = require('../models/appointment.model');
const { Patient } = require('../models/patient.model');

// function to create camp
const createCamp = async (campData) => {
  const { name, location, city, vans, startDate, endDate, specialties, organizerId, clinicId, users } = campData;

  const camp = await Camp.create({
    name,
    location,
    city,
    startDate,
    endDate,
    organizerId,
    clinicId,
    vans,
  });

  const specialtiesDoc = await Specialty.findAll({
    where: {
      id: {
        [Op.in]: specialties,
      },
    },
  });

  if (!specialtiesDoc || specialtiesDoc.length !== specialties.length) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'One or more specialties not found');
  }

  await camp.addSpecialties(specialtiesDoc);

  await camp.addUsers(users);

  return camp;
};

const getCamps = async (clinicId, status = null) => {
  let where = { clinicId };
  if (status) {
    where.status = status;
  }

  console.log('updated where clause', where);

  const camps = await Camp.findAll({
    // where: { status: 'active', clinicId: clinicId },
    where,
    include: [
      { model: User, as: 'users', attributes: ['id', 'name', 'email'] },
      { model: Specialty, as: 'specialties', attributes: ['id', 'name'] },
      { model: Appointment, as: 'appointments', attributes: ['id', 'appointmentDate', 'status'] },
    ],
  });

  return camps;
};

/**
 * Fetch camp details by campId.
 * @param {string} campId
 * @returns {Promise<Object>}
 */
const getCampById = async (campId) => {
  const camp = await Camp.findByPk(campId, {
    include: [
      {
        model: Clinic,
        as: 'clinic',
        attributes: ['id', 'clinicName', 'address', 'city', 'state'],
      },
      {
        model: User,
        as: 'users',
        attributes: ['id', 'name', 'email'],
        through: { attributes: [] }, // Exclude intermediate table fields
      },
      {
        model: Patient,
        as: 'patients',
        attributes: ['id', 'name', 'regNo', 'age', 'sex', 'mobile'],
        through: { attributes: [] }, // Exclude intermediate table fields
        include: [
          {
            model: Appointment,
            as: 'appointments',
            attributes: { exclude: ['createdAt', 'updatedAt'] },
            include: [
              {
                model: Specialty,
                as: 'specialty',
                attributes: { exclude: ['id', 'createdAt', 'updatedAt'] },
              },
            ],
          },
        ],
      },
      // {
      //   model: Appointment,
      //   as: 'appointments',
      //   attributes: ['id', 'appointmentDate', 'status', 'specialtyId', 'patientId', 'campId'],
      // },
      {
        model: Specialty,
        as: 'specialties',
        attributes: ['id', 'name', 'departmentName'],
        through: { attributes: [] }, // Exclude intermediate table fields
      },
    ],
  });

  if (!camp) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Camp not found');
  }

  return camp;
};

const setCurrentCamp = async (campId, userId) => {
  const user = await User.update({ currentCampId: campId }, { where: { id: userId } });
  return user;
};

/**
 * Update a camp by ID
 * @param {string} campId - ID of the camp to update
 * @param {Object} campData - Data to update the camp
 * @returns {Promise<Camp>}
 */
const updateCampById = async (campId, campData) => {
  const { name, location, city, startDate, endDate, specialties, vans, users } = campData;

  console.log('campData -->', campData, new Date());

  // Find existing camp
  const camp = await Camp.findByPk(campId);
  if (!camp) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Camp not found');
  }

  const updatedCampBody = { name, location, city, startDate, endDate, vans };

  // Update basic camp details
  Object.assign(camp, updatedCampBody);

  await camp.save();
  const originalEndDate = camp.endDate;

  // // Check if endDate is today or in the future, and update status to "active"
  // if (endDate && new Date(endDate) >= new Date()) {
  //   camp.status = 'active'; // Set camp status to 'active'
  //   await camp.save(); // Save the updated status
  // }

  // if (endDate && new Date(endDate) < new Date()) {
  //   console.log("inside if condition -->", endDate, new Date(endDate), typeof endDate, typeof new Date(endDate))

  //   camp.status = 'inactive'; // Set camp status to 'inactive'
  //   await camp.save(); // Save the updated status
  // }

  const today = new Date().toISOString().split('T')[0]; // Strip time
  const formattedEndDate = new Date(endDate).toISOString().split('T')[0];

  console.log(`Comparing Dates - Today: ${today}, End Date: ${formattedEndDate}`);

  // 🔹 If endDate has changed, update the camp status accordingly
  if (formattedEndDate !== originalEndDate) {
    if (formattedEndDate >= today) {
      camp.status = 'active';
      console.log('✅ Setting camp as ACTIVE');
    } else {
      camp.status = 'inactive';
      console.log('❌ Setting camp as INACTIVE');
    }
  } else {
    // 🔹 If endDate remains the same but status is incorrect, fix it
    if (camp.status !== 'active' && formattedEndDate >= today) {
      camp.status = 'active';
      console.log('✅ Setting camp as ACTIVE (fallback)');
    } else if (camp.status !== 'inactive' && formattedEndDate < today) {
      camp.status = 'inactive';
      console.log('❌ Setting camp as INACTIVE (fallback)');
    }
  }

  await camp.save();


  // Handle Specialties (Many-to-Many)
  if (specialties) {
    const specialtyRecords = await Specialty.findAll({
      where: { id: { [Op.in]: specialties } },
    });

    if (specialtyRecords.length !== specialties.length) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'One or more specialties not found');
    }

    await camp.setSpecialties(specialtyRecords); // Updates specialties
  }

  // Handle Users (Many-to-Many)
  if (users) {
    const userRecords = await User.findAll({
      where: { id: { [Op.in]: users } },
    });

    if (userRecords.length !== users.length) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'One or more users not found');
    }

    await camp.setUsers(userRecords); // Updates users
  }

  return camp.reload(); // Return updated camp with relations
};
module.exports = {
  createCamp,
  getCamps,
  getCampById,
  setCurrentCamp,
  updateCampById,
};
