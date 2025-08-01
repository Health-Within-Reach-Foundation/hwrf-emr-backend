const Joi = require('joi');

/**
 * Validation for fetching appointments
 */
const getAppointments = {
  query: Joi.object().keys({
    appointmentDate: Joi.date().iso().optional(), // Date picker filter
    status: Joi.string().valid('registered', 'in-progress', 'completed', 'cancelled'), // Filter by status
    specialtyId: Joi.string().uuid().optional(), // Filter by specialty
    sortBy: Joi.string().valid('appointmentDate', 'status').default('appointmentDate'), // Sorting field
    order: Joi.string().valid('asc', 'desc').default('desc'), // Sorting order
    page: Joi.number().integer().min(1).default(1), // Pagination
    limit: Joi.number().integer().min(1).default(10), // Limit per page
  }),
};

/**
 * Validation for booking an appointment
 */
const createAppointment = {
  body: Joi.object().keys({
    patientId: Joi.string().uuid().required(), // Patient ID (UUID)
    specialties: Joi.array().items(Joi.string().uuid()).optional(),
    appointmentDate: Joi.date().required(), // Appointment Date
    status: Joi.string().valid('in queue', 'in', 'out').default('in queue'), // Status with default
  }),
};

/**
 * Validation for updating appointment
 */
const updateAppointment = {
  params: Joi.object().keys({
    appointmentId: Joi.string().uuid().required(), // Filter by specialty
  }),
  body: Joi.object().keys({
    status: Joi.string().valid('in queue', 'in', 'out', 'cancelled').required(),
    statusUpdatedAt: Joi.date().optional(),
  }),
};

module.exports = {
  createAppointment,
  updateAppointment,
  getAppointments,
};
