const parseArrayFields = (fields) => (req, res, next) => {
    try {
      fields.forEach((field) => {
        if (req.body[field] && typeof req.body[field] === 'string') {
          req.body[field] = JSON.parse(req.body[field]);
        }
      });
      next();
    } catch (error) {
      next(new Error(`Failed to parse fields: ${error.message}`));
    }
  };
  
  module.exports = parseArrayFields;
  