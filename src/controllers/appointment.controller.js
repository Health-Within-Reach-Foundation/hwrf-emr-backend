const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const { appointmentService } = require('../services');
const db = require('../models');

/**
 * Books an appointment for a patient.
 *
 * @param {Object} req - The request object.
 * @param {Object} req.body - The body of the request containing appointment details.
 * @param {Object} req.user - The user object containing user details.
 * @param {string} req.user.clinicId - The ID of the clinic.
 * @param {string} [req.user.currentCampId] - The ID of the current camp, if any.
 * @param {Object} res - The response object.
 * @returns {Promise<void>} - A promise that resolves when the appointment is booked and the response is sent.
 */
const bookAppointment = catchAsync(async (req, res) => {
  const transaction = await db.sequelize.transaction();
  try {
    const appoinmentData = {
      ...req.body,
      clinicId: req.user.clinicId,
      campId: req.user?.currentCampId,
    };
    const appointment = await appointmentService.bookAppointment(appoinmentData, transaction);

    await transaction.commit();
    res.status(httpStatus.CREATED).json({
      success: true,
      message: 'Patient added in queue',
      data: appointment,
    });
  } catch (error) {
    await transaction.rollback();
    console.error(error);
  }
});

/**
 * Updates an appointment with the given appointment ID.
 *
 * @param {Object} req - The request object.
 * @param {Object} req.params - The request parameters.
 * @param {string} req.params.appointmentId - The ID of the appointment to update.
 * @param {Object} req.body - The request body containing the update data.
 * @param {Object} res - The response object.
 * @returns {Promise<void>} - A promise that resolves when the appointment is updated.
 */
const updateAppointment = catchAsync(async (req, res) => {
  const { appointmentId } = req.params;
  const appointment = await appointmentService.updateAppointment(appointmentId, req.body);

  res.status(httpStatus.OK).json({
    success: true,
    message: 'Queue updated successfully',
    data: appointment,
  });
});

/**
 * Get a list of appointments based on query parameters.
 *
 * @param {Object} req - Express request object
 * @param {Object} req.query - Query parameters from the request
 * @param {Object} req.user - User object from the request
 * @param {string} req.user.currentCampId - Current camp ID of the user
 * @param {string} req.user.clinicId - Clinic ID of the user
 * @param {Object} res - Express response object
 *
 * @returns {Promise<void>} - Returns a promise that resolves to void
 */
const getAppointments = catchAsync(async (req, res) => {
  const queryOptions = req.query; // Query parameters from request
  const campId = req.user.currentCampId;
  const clinicId = req.user.clinicId;
  const appointments = await appointmentService.getAppointments(queryOptions, clinicId, campId);

  res.status(httpStatus.OK).json({
    success: true,
    message: 'Appointments fetched successfully',
    data: appointments.data,
    meta: appointments.meta,
  });
});

module.exports = {
  bookAppointment,
  getAppointments,
  updateAppointment,
};
