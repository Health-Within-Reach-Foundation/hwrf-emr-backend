const httpStatus = require('http-status');
const ApiError = require('../utils/ApiError');
const { Appointment } = require('../models/appointment.model');
const { Queue } = require('../models/queue.model');
const { Specialty } = require('../models/specialty.model');
const { Patient } = require('../models/patient.model');
const { PatientRecord } = require('../models/patient-record.model');
const { DentistPatientRecord } = require('../models/dentist-patient-record');
const { Camp } = require('../models/camp.model');
const { patientService } = require('.');

/**
 * Books an appointment for a patient.
 *
 * @param {Object} appointmentBody - The body of the appointment request.
 * @param {string} appointmentBody.patientId - The ID of the patient.
 * @param {Array<number>} appointmentBody.specialties - The list of specialty IDs for the appointment.
 * @param {Date} appointmentBody.appointmentDate - The date of the appointment.
 * @param {string} appointmentBody.status - The status of the appointment.
 * @param {string} [appointmentBody.clinicId] - The ID of the clinic.
 * @param {string} [appointmentBody.campId] - The ID of the camp (optional).
 * @returns {Promise<Array<Object>>} - A promise that resolves to an array of created appointment objects.
 * @throws {ApiError} - Throws an error if the patient is not found or if an appointment already exists.
 */
const bookAppointment = async (appointmentBody, transaction = null) => {
  const { patientId, specialties, appointmentDate, status, clinicId, campId } = appointmentBody;

  if (campId) {
    // Step 1: Check if the patient is already associated with the camp
    const camp = await Camp.findByPk(campId, {
      include: {
        model: Patient,
        as: 'patients',
        where: { id: patientId },
        required: false, // Do not enforce join condition
      },
    });

    if (!camp || camp.patients.length === 0) {
      console.log(`⛺ Patient ${patientId} is NOT associated with Camp ${campId}, adding now...`);

      const patient = await patientService.getPatientById(patientId);

      if (!patient) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Patient not found');
      }

      // Step 2: Associate the patient with the camp
      await camp.addPatient(patient, { transaction });
      console.log(`✅ Patient ${patientId} successfully associated with Camp ${campId}`);
    }
  }

  console.log('Received appointmentDate (Raw) -->', appointmentDate, typeof appointmentDate);

  const formattedDate = appointmentDate.toISOString().split('T')[0]; // No need to format, it's already "YYYY-MM-DD"

  console.log('Formatted appointmentDate for DB -->', formattedDate);

  const createdAppointments = [];

  for (const specialty of specialties) {
    const existingAppointment = await Appointment.findOne({
      where: { patientId, specialtyId: specialty, appointmentDate: formattedDate, campId },
    });

    if (existingAppointment) {
      throw new ApiError(httpStatus.BAD_REQUEST, `Already added into queue.`);
    }

    // Create a new appointment
    const appointment = await Appointment.create(
      {
        patientId,
        specialtyId: specialty,
        clinicId,
        appointmentDate: formattedDate, // Store formatted date
        status,
        campId: campId || null, // Handle null campId explicitly
      },
      { transaction }
    );

    createdAppointments.push(appointment);

    // Compare dates correctly
    const today = new Date().toLocaleDateString('en-CA'); // Ensure today's date is correct

    console.log(
      today,
      'today date is matching with formateed Date -->',
      today === formattedDate,
      typeof formattedDate,
      typeof today,
      today
    );
    if (formattedDate == today) {
      console.log(`Adding to queue for specialty (${specialty}) and camp (${campId || 'No Camp'})`);
      await addToQueue(patientId, specialty, formattedDate, clinicId, campId, transaction);
    }
  }

  return createdAppointments;
};

/**
 * Adds a patient to the queue for a specific specialty, clinic, and camp on a given date.
 *
 * @async
 * @function addToQueue
 * @param {string} patientId - The ID of the patient to be added to the queue.
 * @param {string} specialtyId - The ID of the specialty for which the patient is being queued.
 * @param {Date} queueDate - The date for which the patient is being queued.
 * @param {string} clinicId - The ID of the clinic where the patient is being queued.
 * @param {string} [campId] - The ID of the camp where the patient is being queued (optional).
 * @returns {Promise<Object>} The newly created queue entry.
 * @throws {ApiError} If any required fields are missing or if the operation fails.
 */
const addToQueue = async (patientId, specialtyId, queueDate, clinicId, campId, transaction) => {
  try {
    // ✅ Ensure All Required Fields Exist
    if (!patientId || !specialtyId || !queueDate || !clinicId) {
      // throw new ApiError(httpStatus. 'Missing required fields to add patient to queue');
      throw new ApiError(httpStatus.BAD_REQUEST, 'Missing required fields to add patient to queue');
    }

    // ✅ Fetch Last Token for the Specialty, Clinic & Camp
    const lastToken = await Queue.findOne({
      where: { queueDate, specialtyId, clinicId, campId }, // Ensure clinicId is included
      order: [['tokenNumber', 'DESC']],
      lock: true, // Helps prevent race conditions in transactions
    });

    // ✅ Get the Department Name for Queue Type
    const specialty = await Specialty.findByPk(specialtyId);
    if (!specialty) {
      throw new ApiError(httpStatus.BAD_REQUEST, `Service not found.`);
    }

    // ✅ Assign New Token Number
    const newTokenNumber = lastToken ? lastToken.tokenNumber + 1 : 1;

    // ✅ Ensure Atomicity with a Transaction (Prevents Duplicate Token Issues)
    const newQueueEntry = await Queue.create(
      {
        patientId,
        specialtyId,
        queueDate,
        tokenNumber: newTokenNumber,
        clinicId,
        campId,
        queueType: specialty.departmentName,
      },
      { transaction, lock: true }
    );

    return newQueueEntry; // Return the created queue entry
  } catch (error) {
    console.error('[ERROR] Failed to add patient to queue:', error);
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to add patient to queue');
  }
};

/**
 * Updates the status of an appointment.
 *
 * @param {number} appointmentId - The ID of the appointment to update.
 * @param {Object} updateBody - The object containing the updated appointment details.
 * @param {string} updateBody.status - The new status of the appointment.
 * @returns {Promise<Object>} The updated appointment object.
 * @throws {ApiError} If the appointment is not found.
 */
const updateAppointment = async (appointmentId, updateBody) => {
  const appointment = await Appointment.findByPk(appointmentId);

  if (!appointment) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Appointment not found');
  }

  Object.assign(appointment, updateBody);
  await appointment.save();
  return appointment;
};

/**
 * Fetches appointments based on the provided query options, clinic ID, and camp ID.
 *
 * @param {Object} queryOptions - The query options for fetching appointments.
 * @param {date} queryOptions.appointmentDate - The date of the appointment.
 * @param {string} queryOptions.status - The status of the appointment.
 * @param {string} queryOptions.specialtyId - The ID of the specialty.
 * @param {string} [queryOptions.sortBy='createdAt'] - The field to sort by.
 * @param {string} [queryOptions.order='desc'] - The order of sorting (asc or desc).
 * @param {number} [queryOptions.page=1] - The page number for pagination.
 * @param {number} [queryOptions.limit] - The number of records per page.
 * @param {string} clinicId - The ID of the clinic.
 * @param {string} campId - The ID of the camp.
 * @returns {Promise<Object>} The paginated response containing the appointments.
 * @returns {boolean} return.success - Indicates if the operation was successful.
 * @returns {Array} return.data - The list of flattened appointments.
 */
const getAppointments = async (queryOptions, clinicId, campId) => {
  console.log('ClinicId -->', clinicId);

  const { appointmentDate, status, specialtyId, sortBy = 'createdAt', order = 'desc', page = 1, limit } = queryOptions;

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
  // const offset = (page - 1) * limit;

  // Fetch appointments with relations and pagination
  const { rows: appointments, count: total } = await Appointment.findAndCountAll({
    where,
    // limit: parseInt(limit, 10),
    // offset: parseInt(offset, 10),
    order: [[sortBy, order]],
    include: [
      {
        model: Patient,
        as: 'patient',
        attributes: { exclude: ['createdAt', 'updatedAt', 'deletedAt'] },
        include: [
          {
            model: Queue, // Include Queue via Patient
            as: 'queues',
            attributes: ['tokenNumber', 'queueDate', 'queueType', 'specialtyId'], // Queue details
            where: {
              clinicId, // Filter queues by clinic
              campId,
              // queueDate: appointmentDate, // Filter queues by date
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

  // **Flatten Response** to remove nesting
  const flattenedAppointments = appointments.map((appointment, index) => {
    const { patient, specialty, records } = appointment;

    return {
      id: appointment.id,
      appointmentDate: appointment.appointmentDate,
      status: appointment.status,
      statusUpdatedAt: appointment.statusUpdatedAt,
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
      primaryDoctor: patient?.primaryDoctor?.label || null,
      // recordId: record?.id || null,
      // description: record?.description || null,
      // billingDetails: record?.billingDetails || null,
      // dentalData: record?.dentalData || null,
      medicalRecords: records,
    };
  });

  // Return paginated response
  return {
    success: true,
    data: flattenedAppointments,
    // meta: {
    //   total,
    //   // page: parseInt(page, 10),
    //   // limit: parseInt(limit, 10),
    //   // totalPages: Math.ceil(total / limit),
    // },
  };
};

module.exports = {
  bookAppointment,
  updateAppointment,
  getAppointments,
};
