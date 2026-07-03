const { sendError } = require("../utils/response");

function authorize(...allowedRoles) {
  const normalizedAllowedRoles = allowedRoles.map((role) =>
    String(role).toLowerCase()
  );

  return (req, res, next) => {
    if (!req.user) {
      return sendError(res, {
        statusCode: 401,
        message: "Authentication required",
        errors: { authorization: ["Authentication is required."] }
      });
    }

    if (normalizedAllowedRoles.length === 0) {
      return next();
    }

    const hasRole = req.roles.some((role) =>
      normalizedAllowedRoles.includes(role)
    );

    if (!hasRole) {
      return sendError(res, {
        statusCode: 403,
        message: "Insufficient permissions",
        errors: { permission: ["Insufficient permissions."] }
      });
    }

    return next();
  };
}

module.exports = {
  authorize
};
