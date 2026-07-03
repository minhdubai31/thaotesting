const {
  addValidationError,
  isValidUuid,
  sendValidationError
} = require("../utils/validation");

function validateUuidParam(paramName = "id") {
  return (req, res, next) => {
    const value = String(req.params[paramName] || "").trim();

    if (!value || !isValidUuid(value)) {
      const errors = {};
      addValidationError(errors, paramName, `${paramName} must be a valid UUID.`);
      return sendValidationError(res, errors);
    }

    return next();
  };
}

module.exports = {
  validateUuidParam
};
