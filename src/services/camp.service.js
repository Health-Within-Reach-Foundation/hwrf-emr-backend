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

// function to create camp
const createCamp = async (campData) => {
  const { name, address = '', city, state, startDate, endDate, specialties, organizerId, clinicId, users } = campData;

  const camp = await Camp.create({
    name,
    address,
    city,
    state,
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
    include: [
      { model: User, as: 'users', attributes: ['id', 'name', 'email'] },
      { model: Specialty, as: 'specialties', attributes: ['id', 'name'] },
      { model: Appointment, as: 'appointments', attributes: ['id', 'appointmentDate', 'status'] },
    ],
  });

  return camps;
};

module.exports = {
  createCamp,
  getCamps,
};
