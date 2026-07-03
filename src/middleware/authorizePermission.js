const { getPermissionsForRoles } = require("../config/permissions");
const { sendError } = require("../utils/response");

function authorizePermission(permission) {
  return (req, res, next) => {
    if (!req.user) {
      return sendError(res, {
        statusCode: 401,
        message: "Authentication required",
        errors: { authorization: ["Authentication is required."] }
      });
    }

    const userPermissions = getPermissionsForRoles(req.roles || []);

    if (!userPermissions.includes(permission)) {
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
  authorizePermission
};
