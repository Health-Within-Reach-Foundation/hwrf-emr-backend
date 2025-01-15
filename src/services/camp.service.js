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
  const { name, location, city, startDate, endDate, specialties, organizerId, clinicId, users } = campData;

  const camp = await Camp.create({
    name,
    location,
    city,
    startDate,
    endDate,
    organizerId,
    clinicId,
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

const getCamps = async () => {
  const camps = await Camp.findAll({
    where: { status: 'active' },
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
      },
      {
        model: Appointment,
        as: 'appointments',
        attributes: ['id', 'appointmentDate', 'status', 'specialtyId', 'patientId', 'campId'],
      },
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

module.exports = {
  createCamp,
  getCamps,
  getCampById,
  setCurrentCamp,
};
