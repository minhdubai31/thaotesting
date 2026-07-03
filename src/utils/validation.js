const { sendError } = require("./response");

function addValidationError(errors, field, message) {
  if (!errors[field]) {
    errors[field] = [];
  }

  errors[field].push(message);
}

function hasValidationErrors(errors) {
  return Object.keys(errors).length > 0;
}

function sendValidationError(res, errors) {
  return sendError(res, {
    statusCode: 400,
    message: "Validation failed",
    errors
  });
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isValidUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
}

module.exports = {
  addValidationError,
  hasValidationErrors,
  isValidEmail,
  isValidUuid,
  sendValidationError
};
