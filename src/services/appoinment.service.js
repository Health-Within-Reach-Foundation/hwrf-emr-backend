const httpStatus = require('http-status');
const ApiError = require('../utils/ApiError');
const { Appointment } = require('../models/appointment.model');
const { Queue } = require('../models/queue.model');
const { Specialty } = require('../models/specialty.model');
const { Patient } = require('../models/patient.model');
const { PatientRecord } = require('../models/patient-record.model');
const { DentistPatientRecord } = require('../models/dentist-patient-record');
const { Op, Sequelize } = require('sequelize');

/**
 * Book multiple appointments for the patient, segregated by camp.
 * @param {Object} appointmentBody
 * @returns {Promise<Array<Appointment>>}
 */
const bookAppointment = async (appointmentBody) => {
  const { patientId, specialties, appointmentDate, status, clinicId, campId } = appointmentBody;

  // Initialize an array to store created appointments
  const createdAppointments = [];

  for (const specialty of specialties) {
    // Check if an appointment already exists for this specialty and date
    const existingAppointment = await Appointment.findOne({
      where: { patientId, specialtyId: specialty, appointmentDate, campId },
    });

    if (existingAppointment) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        `Appointment already exists for this date, specialty (${specialty}), and camp (${campId || 'No Camp'}).`
      );
    }

    // Create a new appointment for the current specialty and camp
    const appointment = await Appointment.create({
      patientId,
      specialtyId: specialty,
      clinicId,
      appointmentDate,
      status,
      campId: campId || null, // Handle null campId explicitly
    });

    // Push created appointment to the array
    createdAppointments.push(appointment);

    // Add patient to the queue if appointment is today
    const localAppointmentDate = new Date(appointmentDate).toLocaleDateString('en-CA'); // 'YYYY-MM-DD'
    const today = new Date().toLocaleDateString('en-CA'); // 'YYYY-MM-DD'

    if (localAppointmentDate === today) {
      console.log(`Adding to queue for specialty (${specialty}) and camp (${campId || 'No Camp'})`);
      await addToQueue(patientId, specialty, appointmentDate, clinicId, campId);
    }
  }

  return createdAppointments; // Return all created appointments
};

/**
 * Add patient to the queue
 * @param {String} patientId
 * @param {String} specialtyId
 * @param {Date} queueDate
 */
const addToQueue = async (patientId, specialtyId, queueDate, clinicId, campId) => {
  // Increment token number for the day and specialty
  const lastToken = await Queue.findOne({
    where: { queueDate, specialtyId, campId },
    order: [['tokenNumber', 'DESC']],
  });

  const queueType = await Specialty.findByPk(specialtyId);

  const tokenNumber = lastToken ? lastToken.tokenNumber + 1 : 1;

  await Queue.create({
    patientId,
    specialtyId,
    queueDate,
    tokenNumber,
    clinicId,
    campId,
    queueType: queueType.departmentName,
  });
};

/**
 * Update appointment status
 * @param {String} appointmentId
 * @param {Object} updateBody
 * @returns {Promise<Appointment>}
 */
const updateAppointmentStatus = async (appointmentId, updateBody) => {
  const appointment = await Appointment.findByPk(appointmentId);

  if (!appointment) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Appointment not found');
  }

  Object.assign(appointment, updateBody);
  await appointment.save();
  return appointment;
};

/**
 * Fetch appointments with dynamic filters
 * @param {Object} queryOptions
 * @param {String} clinicId
 * @returns {Promise<Object>}
 */
// const getAppointments = async (queryOptions, clinicId) => {
//   console.log('ClinicId -->', clinicId);

//   const {
//     appointmentDate,
//     status,
//     specialtyId,
//     sortBy = 'appointmentDate',
//     order = 'asc',
//     page = 1,
//     limit = 10,
//   } = queryOptions;

//   console.log('appointmentDate -->', appointmentDate);

//   // Build dynamic filters
//   const where = { clinicId }; // Filter by clinic ID

//   if (appointmentDate) {
//     where.appointmentDate = appointmentDate; // Directly match DATE, no time zone
//   }

//   // Filter by status
//   if (status) {
//     where.status = status;
//   }

//   // Filter by specialty
//   if (specialtyId) {
//     where.specialtyId = specialtyId;
//   }

//   // Pagination
//   const offset = (page - 1) * limit;

//   // Fetch appointments with relations and pagination
//   const { rows: appointments, count: total } = await Appointment.findAndCountAll({
//     where,
//     limit: parseInt(limit, 10),
//     offset: parseInt(offset, 10),
//     order: [[sortBy, order]],
//     include: [
//       {
//         model: Patient,
//         as: 'patient',
//         attributes: ['id', 'name', 'age', 'sex', 'mobile', 'regNo'], // Include patient details
//         include: [
//           {
//             model: Queue, // Include Queue via Patient
//             as: 'queues',
//             attributes: ['tokenNumber', 'queueDate', 'queueType', 'specialtyId', 'patientId'], // Only required fields
//             where: {
//               clinicId, // Ensure queue is for the same clinic
//               queueDate: appointmentDate, // Match the queue date with appointmentDate
//             },
//             required: false, // Allow patients without queue data
//           },
//         ],
//       },
//       {
//         model: Specialty,
//         as: 'specialty',
//         attributes: ['id', 'name'], // Include specialty details
//       },
//       {
//         model: PatientRecord,
//         as: 'record',
//         attributes: ['id', 'description', 'billingDetails'], // Include patient record
//         include: [
//           {
//             model: DentistPatientRecord, // Include Dentist-specific data
//             as: 'dentalData',
//             attributes: { exclude: ['createdAt', 'updatedAt'] },
//           },
//         ],
//       },
//     ],
//   });

//   console.log('Appointments -->', appointments);

//   // Return paginated response
//   return {
//     success: true,
//     data: appointments,
//     meta: {
//       total,
//       page: parseInt(page, 10),
//       limit: parseInt(limit, 10),
//       totalPages: Math.ceil(total / limit),
//     },
//   };
// };

const getAppointments = async (queryOptions, clinicId, campId) => {
  console.log('ClinicId -->', clinicId);

  const {
    appointmentDate,
    status,
    specialtyId,
    sortBy = 'appointmentDate',
    order = 'asc',
    page = 1,
    limit = 10,
  } = queryOptions;

  console.log('appointmentDate -->', appointmentDate);

  // Build dynamic filters
  const where = { clinicId, campId }; // Filter by clinic ID

  if (appointmentDate) {
    where.appointmentDate = appointmentDate; // Match DATE directly
  }

  if (status) {
    where.status = status; // Filter by status
  }

  if (specialtyId) {
    where.specialtyId = specialtyId; // Filter by specialty
  }

  // Pagination
  const offset = (page - 1) * limit;

  // Fetch appointments with relations and pagination
  const { rows: appointments, count: total } = await Appointment.findAndCountAll({
    where,
    limit: parseInt(limit, 10),
    offset: parseInt(offset, 10),
    order: [[sortBy, order]],
    include: [
      {
        model: Patient,
        as: 'patient',
        attributes: ['id', 'name', 'age', 'sex', 'mobile', 'regNo'], // Patient details
        include: [
          {
            model: Queue, // Include Queue via Patient
            as: 'queues',
            attributes: ['tokenNumber', 'queueDate', 'queueType', 'specialtyId'], // Queue details
            where: {
              clinicId, // Filter queues by clinic
              queueDate: appointmentDate, // Filter queues by date
            },
            required: false, // Allow patients without queue data
          },
        ],
      },
      {
        model: Specialty,
        as: 'specialty',
        attributes: ['id', 'name'], // Specialty details
      },
      {
        model: PatientRecord,
        as: 'records',
        attributes: ['id', 'description', 'billingDetails'], // Patient record details
        include: [
          {
            model: DentistPatientRecord, // Dentist-specific data
            as: 'dentalData',
            attributes: { exclude: ['createdAt', 'updatedAt'] },
          },
        ],
      },
    ],
  });

  console.log('Raw Appointments -->', appointments);

  // **Flatten Response** to remove nesting
  const flattenedAppointments = appointments.map((appointment, index) => {
    const { patient, specialty, records } = appointment;

    console.log('Patient -->', patient.queues);
    return {
      id: appointment.id,
      appointmentDate: appointment.appointmentDate,
      status: appointment.status,
      specialtyId: specialty?.id,
      specialtyName: specialty?.name,
      patientId: patient?.id,
      patientName: patient?.name,
      patientAge: patient?.age,
      patientSex: patient?.sex,
      patientMobile: patient?.mobile,
      patientRegNo: patient?.regNo,
      tokenNumber: patient?.queues?.find((queue) => queue.specialtyId === appointment.specialtyId).tokenNumber || null, // Extract token number
      queueType: patient?.queues?.find((queue) => queue.specialtyId === appointment.specialtyId).queueType || null, // Extract queue type
      queueDate: patient?.queues?.find((queue) => queue.specialtyId === appointment.specialtyId).queueDate || null, // Extract queue date
      // recordId: record?.id || null,
      // description: record?.description || null,
      // billingDetails: record?.billingDetails || null,
      // dentalData: record?.dentalData || null,
      medicalRecords: records,
    };
  });

  console.log('Flattened Appointments -->', flattenedAppointments);

  // Return paginated response
  return {
    success: true,
    data: flattenedAppointments,
    meta: {
      total,
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      totalPages: Math.ceil(total / limit),
    },
  };
};

const markAppointment = async (appointmentId, updatedBody) => {
  const appointment = await Appointment.findByPk(appointmentId);

  if (!appointment) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Appointment not found');
  }

  Object.assign(appointment, updatedBody);
  await appointment.save();
  return appointment;
};

module.exports = {
  bookAppointment,
  updateAppointmentStatus,
  getAppointments,
  markAppointment,
};
