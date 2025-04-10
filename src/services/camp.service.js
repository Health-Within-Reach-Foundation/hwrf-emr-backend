const httpStatus = require('http-status');
const { Clinic } = require('../models/clinic.model');
const ApiError = require('../utils/ApiError');
const { Specialty } = require('../models/specialty.model');
const { Op } = require('sequelize');
const { User } = require('../models/user.model');
const { Role } = require('../models/role.model');
const { Camp } = require('../models/camp.model');
const { Appointment } = require('../models/appointment.model');
const { Patient } = require('../models/patient.model');
const { Queue } = require('../models/queue.model');
const { Mammography } = require('../models/mammography.model');
const { Treatment } = require('../models/treatment.model');
const { Diagnosis } = require('../models/diagnosis.model');
const { TreatmentSetting } = require('../models/treatment-setting.model');
const {
  calculateCampAnalytics,
  calculateDentistryAnalytics,
  calculateGPAnalytics,
  calculateMammographyAnalytics,
} = require('../utils/camp-utility');
const { GeneralPhysicianRecord } = require('../models/gp-record.model');

/**
 * Creates a new camp with the provided data.
 *
 * @param {Object} campData - The data for the new camp.
 * @param {string} campData.name - The name of the camp.
 * @param {string} campData.location - The location of the camp.
 * @param {string} campData.city - The city where the camp is located.
 * @param {Array<number>} campData.vans - The list of van IDs associated with the camp.
 * @param {Date} campData.startDate - The start date of the camp.
 * @param {Date} campData.endDate - The end date of the camp.
 * @param {Array<number>} campData.specialties - The list of specialty IDs associated with the camp.
 * @param {number} campData.organizerId - The ID of the organizer of the camp.
 * @param {number} campData.clinicId - The ID of the clinic associated with the camp.
 * @param {Array<number>} campData.users - The list of user IDs associated with the camp.
 * @returns {Promise<Object>} The created camp object.
 * @throws {ApiError} If one or more specialties are not found.
 */
const createCamp = async (campData, transaction = null) => {
  const { name, location, city, vans, startDate, endDate, specialties, organizerId, clinicId, users } = campData;

  const camp = await Camp.create(
    {
      name,
      location,
      city,
      startDate,
      endDate,
      organizerId,
      clinicId,
      vans,
    },
    { transaction }
  );

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

  await camp.addSpecialties(specialtiesDoc, { transaction });

  await camp.addUsers(users, { transaction });

  return camp;
};

/**
 * Retrieves a list of camps based on the provided clinic ID and optional status.
 *
 * @param {number} clinicId - The ID of the clinic to filter camps by.
 * @param {string|null} [status=null] - The optional status to filter camps by. If not provided, all statuses are included.
 * @returns {Promise<Array>} A promise that resolves to an array of camp objects.
 */
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
      // { model: Appointment, as: 'appointments', attributes: ['id', 'appointmentDate', 'status'] },
    ],
    order: [['startDate', 'DESC']],
  });

  return camps;
};

/**
 * Fetch camp details by campId.
 * @param {uid} campId
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
          {
            model: Queue, // Include Queue via Patient
            as: 'queues',
            attributes: ['tokenNumber', 'queueDate', 'queueType', 'specialtyId'], // Queue details
            where: {
              campId,
              // queueDate: appointmentDate, // Filter queues by date
            },
            required: false, // Allow patients without queue data
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

/**
 * Sets the current camp for a user.
 *
 * @param {number} campId - The ID of the camp to set as current.
 * @param {number} userId - The ID of the user whose current camp is being set.
 * @returns {Promise<Object>} - A promise that resolves to the updated user object.
 */
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
const updateCampById = async (campId, campData, transaction = null) => {
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

  await camp.save({ transaction });
  const originalEndDate = camp.endDate;

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

  await camp.save({ transaction });

  // Handle Specialties (Many-to-Many)
  if (specialties) {
    const specialtyRecords = await Specialty.findAll({
      where: { id: { [Op.in]: specialties } },
    });

    if (specialtyRecords.length !== specialties.length) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'One or more specialties not found');
    }

    await camp.setSpecialties(specialtyRecords, { transaction }); // Updates specialties
  }

  // Handle Users (Many-to-Many)
  if (users) {
    const userRecords = await User.findAll({
      where: { id: { [Op.in]: users } },
    });

    if (userRecords.length !== users.length) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'One or more users not found');
    }

    await camp.setUsers(userRecords, { transaction }); // Updates users
  }

  return camp.reload({ transaction }); // Return updated camp with relations
};

/**
 * Fetches detailed information about a specific camp, including associated clinics, users, patients, and their related data.
 *
 * @param {number} campId - The ID of the camp to fetch details for.
 * @returns {Promise<Object>} - A promise that resolves to an object containing camp details, flattened patients for UI display, and analytics data.
 * @throws {ApiError} - Throws an error if the camp is not found.
 *
 * @example
 * const campDetails = await getCampDetails(1);
 * console.log(campDetails);
 *
 * @typedef {Object} CampDetails
 * @property {Object} camp - The camp details.
 * @property {Array<Object>} patients - Flattened patients for UI display.
 * @property {Object} analytics - Analytics data calculated from unique patients.
 */
const getCampDetails = async (campId) => {
  console.log('Fetching camp details for campId:', campId);
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
        through: { attributes: [] },
      },
      {
        model: Patient,
        as: 'patients',
        attributes: ['id', 'name', 'regNo', 'age', 'sex', 'mobile'],
        through: { attributes: [] },
        include: [
          {
            model: Appointment,
            as: 'appointments',
            where: { campId },
            attributes: { exclude: ['createdAt', 'updatedAt'] },
            required: false,
            include: [
              {
                model: Specialty,
                as: 'specialty',
                attributes: { exclude: ['id', 'createdAt', 'updatedAt'] },
              },
            ],
          },
          {
            model: Queue,
            as: 'queues',
            attributes: ['tokenNumber', 'queueDate', 'queueType', 'specialtyId'],
            where: { campId },
            required: false,
          },
          {
            model: Diagnosis,
            as: 'diagnoses',
            attributes: ['id', 'createdAt'],
            required: false,
            include: [
              {
                model: Treatment,
                as: 'treatment',
                attributes: ['id', 'paidAmount', 'status'],
                required: false,
                include: [
                  {
                    model: TreatmentSetting,
                    as: 'treatmentSettings',
                    attributes: ['id', 'treatingDoctor', 'onlineAmount', 'offlineAmount', 'crownStatus', 'nextDate'],
                    where: { campId },
                    required: false,
                  },
                ],
              },
            ],
          },
          {
            model: Mammography,
            as: 'mammography',
            attributes: ['id', 'createdAt', 'onlineAmount', 'offlineAmount'],
            required: false,
            where: { campId },
          },
          {
            model: GeneralPhysicianRecord,
            as: 'gpRecords',
            attributes: ['id', 'createdAt', 'onlineAmount', 'offlineAmount'],
            required: false,
            where: { campId },
          },
        ],
      },
      {
        model: Specialty,
        as: 'specialties',
        attributes: ['id', 'name', 'departmentName'],
        through: { attributes: [] },
      },
    ],
  });

  if (!camp) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Camp not found');
  }

  console.log('Total registered patients:', camp.patients.length);
  console.log('Camp patient', camp.patients[0]);

  // **Step 1: Flat patients for UI display (Can contain duplicates for multiple services)**
  const flatPatients = camp.patients.flatMap((patient) => {
    const appointments = patient.appointments.length > 0 ? patient.appointments : [null];

    return appointments.map((appointment) => {
      const queue = appointment ? patient.queues.find((q) => q.specialtyId === appointment.specialtyId) : null;
      const totalPaidAmount = patient.diagnoses.reduce((sum, diagnosis) => {
        return sum + (diagnosis.treatment ? Number(diagnosis.treatment.paidAmount) : 0);
      }, 0);
      const totalGPPaidAmount = patient.gpRecords.reduce((sum, record) => {
        return (
          sum +
          (record
            ? (record.onlineAmount ? Number(record.onlineAmount) : 0) +
              (record.offlineAmount ? Number(record.offlineAmount) : 0)
            : 0)
        );
      }, 0);

      const totalMammoPaidAmount = patient.mammography
        ? (patient.mammography.onlineAmount ? Number(patient.mammography.onlineAmount) : 0) +
          (patient.mammography.offlineAmount ? Number(patient.mammography.offlineAmount) : 0)
        : 0;

      const treatingDoctors = Array.from(
        new Set(
          patient.diagnoses.flatMap((diagnosis) => {
            return diagnosis.treatment ? diagnosis.treatment.treatmentSettings.map((ts) => ts.treatingDoctor) : [];
          })
        )
      );

      return {
        ...patient.toJSON(),
        treatmentDate: appointment ? appointment.appointmentDate : null,
        tokenNumber: queue ? queue.tokenNumber : null,
        serviceTaken: queue ? queue.queueType : null,
        paidAmount:
          queue && queue.queueType === 'Dentistry'
            ? totalPaidAmount
            : queue && queue.queueType === 'GP'
            ? totalGPPaidAmount
            : queue && queue.queueType === 'Mammography'
            ? totalMammoPaidAmount
            : null,
        treatingDoctors: queue && queue.queueType === 'Dentistry' ? treatingDoctors : null,
      };
    });
  });

  console.log('Flattened patients for UI:', flatPatients.length);

  // **Step 2: Unique patients for analytics (Each patient appears only once)**
  const uniquePatients = camp.patients.map((patient) => ({
    ...patient.toJSON(),
    hasAppointments: patient.appointments.length > 0,
    hasQueues: patient.queues.length > 0,
    servicesTaken: Array.from(new Set(patient.queues.map((q) => q.queueType))),
  }));

  console.log('Unique patients for analytics:', uniquePatients.length);

  // **Step 3: Calculate analytics using unique patients**
  const campAnalytics = calculateCampAnalytics(uniquePatients);
  campAnalytics.dentistryAnalytics = calculateDentistryAnalytics(uniquePatients);
  campAnalytics.gpAnalytics = calculateGPAnalytics(uniquePatients);
  campAnalytics.mammoAnalytics = calculateMammographyAnalytics(uniquePatients);

  return {
    ...camp.toJSON(),
    patients: flatPatients, // Use `flatPatients` for UI
    analytics: campAnalytics, // Use `uniquePatients` for analytics
  };
};

// Function to get the analytics like revenue, patient category by service taken, revenue category by services for the On going month all camps
const getAllCampsAnalytics = async (clinicId) => {
  const startDate = new Date();
  startDate.setDate(1); // First day of the current month
  startDate.setHours(0, 0, 0, 0);

  const endDate = new Date();
  endDate.setMonth(endDate.getMonth() + 1);
  endDate.setDate(0); // Last day of the current month
  endDate.setHours(23, 59, 59, 999);

  console.log('Fetching camp analytics for current month:', startDate, 'to', endDate);

  const camps = await Camp.findAll({
    // where: { startDate: { [Op.between]: [startDate, endDate] }, clinicId }, // Filter camps for current month
    where: { clinicId }, // Filter camps for current month
    include: [
      {
        model: Patient,
        as: 'patients',
        attributes: ['id', 'name', 'regNo', 'age', 'sex', 'mobile'],
        through: { attributes: [] },
        include: [
          {
            model: Appointment,
            as: 'appointments',
            attributes: { exclude: ['createdAt', 'updatedAt'] },
            required: false,
            include: [
              {
                model: Specialty,
                as: 'specialty',
                attributes: { exclude: ['id', 'createdAt', 'updatedAt'] },
              },
            ],
          },
          {
            model: Queue,
            as: 'queues',
            attributes: ['tokenNumber', 'queueDate', 'queueType', 'specialtyId'],
            required: false,
          },
          {
            model: Diagnosis,
            as: 'diagnoses',
            attributes: ['id', 'createdAt'],
            required: false,
            include: [
              {
                model: Treatment,
                as: 'treatment',
                attributes: ['id', 'paidAmount', 'status'],
                required: false,
                include: [
                  {
                    model: TreatmentSetting,
                    as: 'treatmentSettings',
                    attributes: ['id', 'treatingDoctor', 'onlineAmount', 'offlineAmount', 'crownStatus', 'nextDate'],
                    required: false,
                  },
                ],
              },
            ],
          },
          {
            model: Mammography,
            as: 'mammography',
            attributes: ['id', 'createdAt', 'onlineAmount', 'offlineAmount'],
            required: false,
          },
          {
            model: GeneralPhysicianRecord,
            as: 'gpRecords',
            attributes: ['id', 'createdAt', 'onlineAmount', 'offlineAmount'],
            required: false,
          },
        ],
      },
    ],
  });

  if (!camps || camps.length === 0) {
    throw new ApiError(httpStatus.NOT_FOUND, 'No camps found for this month');
  }

  let totalRegisteredPatients = 0;
  let totalAttended = 0;
  let totalMissed = 0;
  let totalEarnings = 0;

  let dentistryAnalytics = {
    totalPatients: 0,
    totalAttended: 0,
    totalMissed: 0,
    totalEarnings: 0,
  };

  let gpAnalytics = {
    totalPatients: 0,
    totalAttended: 0,
    totalMissed: 0,
    totalEarnings: 0,
  };

  let mammoAnalytics = {
    totalPatients: 0,
    totalAttended: 0,
    totalMissed: 0,
    totalEarnings: 0,
  };

  camps.forEach((camp) => {
    const uniquePatients = camp.patients.map((p) => ({
      ...p.toJSON(),
      hasAppointments: p.appointments.length > 0,
      hasQueues: p.queues.length > 0,
      servicesTaken: Array.from(new Set(p.queues.map((q) => q.queueType))),
    }));

    totalRegisteredPatients += uniquePatients.length;
    totalAttended += uniquePatients.filter((p) => p.hasAppointments).length;
    totalMissed += uniquePatients.length - totalAttended;

    const campDentistry = calculateDentistryAnalytics(uniquePatients);
    const campGP = calculateGPAnalytics(uniquePatients);
    const campMammo = calculateMammographyAnalytics(uniquePatients);

    dentistryAnalytics.totalPatients += campDentistry.totalDentistryPatients;
    dentistryAnalytics.totalAttended += campDentistry.totalAttended;
    dentistryAnalytics.totalMissed += campDentistry.missed;
    dentistryAnalytics.totalEarnings += campDentistry.totalEarnings;

    gpAnalytics.totalPatients += campGP.totalGPPatients;
    gpAnalytics.totalAttended += campGP.totalAttended;
    gpAnalytics.totalMissed += campGP.missed;
    gpAnalytics.totalEarnings += campGP.onlineEarnings + campGP.offlineEarnings;

    mammoAnalytics.totalPatients += campMammo.totalMammographyPatients;
    mammoAnalytics.totalAttended += campMammo.totalAttended;
    mammoAnalytics.totalMissed += campMammo.missed;
    mammoAnalytics.totalEarnings += campMammo.onlineEarnings + campMammo.offlineEarnings;

    totalEarnings +=
      campDentistry.totalEarnings +
      campGP.onlineEarnings +
      campGP.offlineEarnings +
      campMammo.onlineEarnings +
      campMammo.offlineEarnings;
  });

  return {
    totalCamps: camps.length,
    totalRegisteredPatients,
    totalAttended,
    totalMissed,
    totalEarnings,
    dentistryAnalytics,
    gpAnalytics,
    mammoAnalytics,
  };
};

module.exports = {
  createCamp,
  getCamps,
  getCampById,
  setCurrentCamp,
  updateCampById,
  getCampDetails,
  getAllCampsAnalytics,
};
