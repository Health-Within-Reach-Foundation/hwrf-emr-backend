const { clinicStatus } = require('../config/constants');
const { ermRoles } = require('../config/roles');


/**
 * Validates a password based on specific criteria.
 *
 * @param {string} value - The password to validate.
 * @param {object} helpers - An object containing helper functions for validation.
 * @returns {string|object} - Returns the password if valid, otherwise returns a validation error message.
 */
const password = (value, helpers) => {
  if (value.length < 8) {
    return helpers.message('password must be at least 8 characters');
  }
  if (!value.match(/\d/) || !value.match(/[a-zA-Z]/)) {
    return helpers.message('password must contain at least 1 letter and 1 number');
  }
  return value;
};

/**
 * Validates the clinic status.
 *
 * @param {string} value - The clinic status value to validate.
 * @param {object} helpers - The helpers object provided by the validation library.
 * @returns {string} - The validated clinic status value.
 * @throws {Error} - If the clinic status value is not correct.
 */
const clinicStatusValidation = (value, helpers) => {
  if (!clinicStatus.includes(value)) {
    return helpers.message('status is not correct');
  }

  return value;
};

/**
 * Validates if the provided role is included in the list of allowed roles.
 *
 * @param {string} value - The role value to be validated.
 * @param {object} helpers - The validation helpers object.
 * @returns {string} - The validated role value if it is correct.
 * @throws {Error} - If the role is not correct, an error message is returned.
 */
const role = (value, helpers) => {
  if (!ermRoles.includes(value)) {
    return helpers.message('role is not correct');
  }

  return value;
};

module.exports = {
  password,
  role,
  clinicStatusValidation,
};
