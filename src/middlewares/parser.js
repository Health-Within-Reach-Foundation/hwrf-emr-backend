/**
 * Middleware to parse specified fields in the request body as JSON arrays.
 *
 * @param {string[]} fields - An array of field names to be parsed.
 * @returns {function} Middleware function to parse specified fields.
 *
 * @example
 * // Usage in an Express app
 * const parseArrayFields = require('./middlewares/parser');
 * app.use(parseArrayFields(['field1', 'field2']));
 *
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @param {function} next - Express next middleware function.
 */
const parseArrayFields = (fields) => (req, res, next) => {
  try {
    fields.forEach((field) => {
      console.log("parsing key --> ", field);
      if (req.body[field] && typeof req.body[field] === 'string') {
        req.body[field] = JSON.parse(req.body[field]);
      }
    });
    next();
  } catch (error) {
    next(new Error(`Failed to parse fields: ${error.message}`));
  }
};

// const parseArrayFields = (fields) => (req, res, next) => {
//   try {
//     fields.forEach((field) => {
//       if (req.body[field]) {
//         const fieldValue = req.body[field];

//         if (typeof fieldValue === 'string') {
//           try {
//             const parsedValue = JSON.parse(fieldValue);

//             // Check if parsed value is an array or object
//             if (Array.isArray(parsedValue) || (typeof parsedValue === 'object' && parsedValue !== null)) {
//               req.body[field] = parsedValue;
//             } else {
//               // If it's not an array or object after parsing, leave it as it is
//               req.body[field] = fieldValue;
//             }
//           } catch (error) {
//             // If parsing fails, leave it as it is
//             req.body[field] = fieldValue;
//           }
//         }
//       }
//     });
//     next();
//   } catch (error) {
//     next(new Error(`Failed to parse fields: ${error.message}`));
//   }
// };

module.exports = parseArrayFields;
