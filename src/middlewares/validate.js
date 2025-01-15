const Joi = require('joi');
const httpStatus = require('http-status');
const pick = require('../utils/pick');
const ApiError = require('../utils/ApiError');

// const validate = (schema) => (req, res, next) => {
//   const validSchema = pick(schema, ['params', 'query', 'body']);
//   const object = pick(req, Object.keys(validSchema));
//   const { value, error } = Joi.compile(validSchema)
//     .prefs({ errors: { label: 'key' }, abortEarly: false })
//     .validate(object);

//   if (error) {
//     const errorMessage = error.details.map((details) => details.message).join(', ');
//     return next(new ApiError(httpStatus.BAD_REQUEST, errorMessage));
//   }
//   Object.assign(req, value);
//   return next();
// };

const validate = (schema) => (req, res, next) => {
  // Validate request body, params, and query
  const validSchema = pick(schema, ['params', 'query', 'body']);
  const object = pick(req, Object.keys(validSchema));
  const { value, error } = Joi.compile(validSchema)
    .prefs({ errors: { label: 'key' }, abortEarly: false })
    .validate(object);

  if (error) {
    const errorMessage = error.details.map((details) => details.message).join(', ');
    return next(new ApiError(httpStatus.BAD_REQUEST, errorMessage));
  }

  // Validate files (e.g., xray files)
  if (schema.files) {
    const fileError = schema.files(req.files || []); // Handle missing files gracefully
    if (fileError) {
      return next(new ApiError(httpStatus.BAD_REQUEST, fileError));
    }
  }

  Object.assign(req, value);
  return next();
};



module.exports = validate;
