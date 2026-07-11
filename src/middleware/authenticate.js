const jwt = require("jsonwebtoken");
const { jwtSecret } = require("../config/env");
const { prisma } = require("../config/prisma");
const { sendError } = require("../utils/response");

function getBearerToken(headerValue) {
  if (!headerValue) {
    return null;
  }

  const [scheme, token] = headerValue.split(" ");
  if (scheme !== "Bearer" || !token) {
    return null;
  }

  return token;
}

async function authenticate(req, res, next) {
  try {
    const token = getBearerToken(req.headers.authorization);

    if (!token) {
      return sendError(res, {
        statusCode: 401,
        message: "Authentication failed",
        errors: { authorization: ["Missing bearer token."] }
      });
    }

    let payload;

    try {
      payload = jwt.verify(token, jwtSecret);
    } catch (error) {
      return sendError(res, {
        statusCode: 401,
        message: "Authentication failed",
        errors: { authorization: ["Invalid or expired token."] }
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        roles: true,
        tokenVersion: true,
        createdAt: true
      }
    });

    if (!user) {
      return sendError(res, {
        statusCode: 401,
        message: "Authentication failed",
        errors: { user: ["User no longer exists."] }
      });
    }

    if (
      !Number.isInteger(payload.tokenVersion) ||
      payload.tokenVersion !== user.tokenVersion
    ) {
      return sendError(res, {
        statusCode: 401,
        message: "Authentication failed",
        errors: { authorization: ["Token has been invalidated by a newer login."] }
      });
    }

    req.user = user;
    req.roles = Array.isArray(user.roles)
      ? user.roles.map((role) => String(role).toLowerCase())
      : [];
    req.accessToken = token;

    return next();
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  authenticate
};
