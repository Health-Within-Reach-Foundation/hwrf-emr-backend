const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const { appointmentService } = require('../services');

// Controller for booking appointment
const bookAppointment = catchAsync(async (req, res) => {
  // Service call to book appointment
  const appoinmentData = {
    ...req.body,
    clinicId: req.user.clinicId,
    campId: req.user?.currentCampId,
  };
  const appointment = await appointmentService.bookAppointment(appoinmentData);

  // Return response
  res.status(httpStatus.CREATED).json({
    success: true,
    message: 'Patient added in queue',
    data: appointment,
  });
});

// Controller for updating appointment status
const updateAppointmentStatus = catchAsync(async (req, res) => {
  const { appointmentId } = req.params;
  const appointment = await appointmentService.updateAppointmentStatus(appointmentId, req.body);

  res.status(httpStatus.OK).json({
    success: true,
    message: 'Appointment status updated successfully',
    data: appointment,
  });
});

/**
 * Fetch all appointments with filters and sorting
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

const markAppointment = catchAsync(async (req, res) => {
  const appointmentId = req.params.appointmentId;

  const markedAppointment = await appointmentService.markAppointment(appointmentId,req.body);

  res.status(httpStatus.OK).json({
    success: true,
    message: `Marked the appointment as ${req.body.status}`,
    data: markedAppointment,
  });
});

module.exports = {
  bookAppointment,
  getAppointments,
  updateAppointmentStatus,
  markAppointment,
};
