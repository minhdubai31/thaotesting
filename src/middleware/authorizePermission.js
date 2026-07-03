const { getPermissionsForRoles } = require("../config/permissions");

function authorizePermission(permission) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const userPermissions = getPermissionsForRoles(req.roles || []);

    if (!userPermissions.includes(permission)) {
      return res.status(403).json({ message: "Insufficient permissions" });
    }

    return next();
  };
}

module.exports = {
  authorizePermission
};
