const { rolePermissions } = require("../config/permissions");
const { prisma } = require("../config/prisma");
const { buildMeta, parsePagination, parseSort, readSearch } = require("../utils/pagination");
const { sendError, sendSuccess } = require("../utils/response");
const {
  addValidationError,
  hasValidationErrors,
  sendValidationError
} = require("../utils/validation");

const allowedRoles = Object.keys(rolePermissions);

async function listUsers(req, res, next) {
  try {
    const { page, pageSize, skip, take } = parsePagination(req.query);
    const q = readSearch(req.query.q);
    const where = q
      ? {
          OR: ["email", "username"].map((field) => ({
            [field]: { contains: q, mode: "insensitive" }
          }))
        }
      : {};

    const [users, total] = await prisma.$transaction([
      prisma.user.findMany({
        where,
        skip,
        take,
        orderBy: parseSort(req.query, ["email", "createdAt"], "createdAt"),
        select: {
          id: true,
          email: true,
          username: true,
          roles: true,
          createdAt: true
        }
      }),
      prisma.user.count({ where })
    ]);

    return sendSuccess(res, {
      message: "Users fetched",
      data: { users, meta: buildMeta({ page, pageSize, total }) }
    });
  } catch (error) {
    return next(error);
  }
}

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

    const existingUser = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: { id: true }
    });

    if (!existingUser) {
      addValidationError(errors, "id", "User does not exist.");
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

    return sendSuccess(res, {
      message: "User roles updated",
      data: { user }
    });
  } catch (error) {
    if (error.code === "P2025") {
      return sendError(res, {
        statusCode: 404,
        message: "User not found",
        errors: { id: ["User not found."] }
      });
    }

    return next(error);
  }
}

module.exports = {
  listUsers,
  updateUserRoles
};
