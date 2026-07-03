const { rolePermissions } = require("../config/permissions");
const { prisma } = require("../config/prisma");
const {
  addValidationError,
  hasValidationErrors,
  sendValidationError
} = require("../utils/validation");

const allowedRoles = Object.keys(rolePermissions);

function normalizeRoles(roles) {
  if (!Array.isArray(roles) || roles.length === 0) {
    return null;
  }

  const normalizedRoles = [
    ...new Set(roles.map((role) => String(role || "").trim().toLowerCase()))
  ];

  if (
    normalizedRoles.some((role) => !role || !allowedRoles.includes(role))
  ) {
    return null;
  }

  return normalizedRoles;
}

async function updateUserRoles(req, res, next) {
  try {
    const roles = normalizeRoles(req.body.roles);
    const errors = {};

    if (!Array.isArray(req.body.roles)) {
      addValidationError(errors, "roles", "Roles must be an array.");
    } else if (req.body.roles.length === 0) {
      addValidationError(errors, "roles", "Roles must include at least one role.");
    } else if (!roles) {
      addValidationError(
        errors,
        "roles",
        `Roles must only use: ${allowedRoles.join(", ")}.`
      );
    }

    if (hasValidationErrors(errors)) {
      return sendValidationError(res, errors);
    }

    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { roles },
      select: {
        id: true,
        email: true,
        roles: true,
        createdAt: true,
        updatedAt: true
      }
    });

    return res.json({ user });
  } catch (error) {
    if (error.code === "P2025") {
      return res.status(404).json({ message: "User not found" });
    }

    return next(error);
  }
}

module.exports = {
  updateUserRoles
};
