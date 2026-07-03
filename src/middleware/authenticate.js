const jwt = require("jsonwebtoken");
const { jwtSecret } = require("../config/env");
const { prisma } = require("../config/prisma");

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
      return res.status(401).json({ message: "Missing bearer token" });
    }

    let payload;

    try {
      payload = jwt.verify(token, jwtSecret);
    } catch (error) {
      return res.status(401).json({ message: "Invalid or expired token" });
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        roles: true,
        createdAt: true
      }
    });

    if (!user) {
      return res.status(401).json({ message: "User no longer exists" });
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
