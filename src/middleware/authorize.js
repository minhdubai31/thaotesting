function authorize(...allowedRoles) {
  const normalizedAllowedRoles = allowedRoles.map((role) =>
    String(role).toLowerCase()
  );

  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    if (normalizedAllowedRoles.length === 0) {
      return next();
    }

    const hasRole = req.roles.some((role) =>
      normalizedAllowedRoles.includes(role)
    );

    if (!hasRole) {
      return res.status(403).json({ message: "Insufficient permissions" });
    }

    return next();
  };
}

module.exports = {
  authorize
};
