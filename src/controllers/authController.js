const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { jwtExpiresIn, jwtSecret } = require("../config/env");
const { prisma } = require("../config/prisma");
const { sendError, sendSuccess } = require("../utils/response");
const {
  addValidationError,
  hasValidationErrors,
  isValidEmail,
  sendValidationError
} = require("../utils/validation");

const passwordSaltRounds = 12;

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function sanitizeUser(user) {
  return {
    id: user.id,
    email: user.email,
    roles: user.roles || [],
    createdAt: user.createdAt
  };
}

function createToken(user) {
  return jwt.sign(
    {
      email: user.email,
      roles: user.roles || [],
      tokenVersion: user.tokenVersion
    },
    jwtSecret,
    {
      subject: user.id,
      expiresIn: jwtExpiresIn
    }
  );
}

async function signup(req, res, next) {
  try {
    const email = normalizeEmail(req.body.email);
    const password = String(req.body.password || "");
    const errors = {};

    if (!email) {
      addValidationError(errors, "email", "Email is required.");
    } else if (!isValidEmail(email)) {
      addValidationError(errors, "email", "Email must be a valid email address.");
    }

    if (!password) {
      addValidationError(errors, "password", "Password is required.");
    } else if (password.length < 8) {
      addValidationError(
        errors,
        "password",
        "Password must be at least 8 characters."
      );
    }

    if (hasValidationErrors(errors)) {
      return sendValidationError(res, errors);
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true }
    });

    if (existingUser) {
      addValidationError(errors, "email", "Email already exists.");
      return sendValidationError(res, errors);
    }

    const passwordHash = await bcrypt.hash(password, passwordSaltRounds);

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        roles: ["user"]
      },
      select: {
        id: true,
        email: true,
        roles: true,
        tokenVersion: true,
        createdAt: true
      }
    });

    return sendSuccess(res, {
      statusCode: 201,
      message: "Signup successful",
      data: {
        user: sanitizeUser(user),
        token: createToken(user)
      }
    });
  } catch (error) {
    if (error.code === "P2002") {
      return sendError(res, {
        statusCode: 409,
        message: "Email already exists",
        errors: { email: ["Email already exists."] }
      });
    }

    return next(error);
  }
}

async function login(req, res, next) {
  try {
    const email = normalizeEmail(req.body.email);
    const password = String(req.body.password || "");
    const errors = {};

    if (!email) {
      addValidationError(errors, "email", "Email is required.");
    } else if (!isValidEmail(email)) {
      addValidationError(errors, "email", "Email must be a valid email address.");
    }

    if (!password) {
      addValidationError(errors, "password", "Password is required.");
    }

    if (hasValidationErrors(errors)) {
      return sendValidationError(res, errors);
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        passwordHash: true,
        roles: true,
        createdAt: true
      }
    });

    if (!user) {
      return sendError(res, {
        statusCode: 401,
        message: "Invalid email or password",
        errors: { credentials: ["Invalid email or password."] }
      });
    }

    const isValidPassword = await bcrypt.compare(password, user.passwordHash);

    if (!isValidPassword) {
      return sendError(res, {
        statusCode: 401,
        message: "Invalid email or password",
        errors: { credentials: ["Invalid email or password."] }
      });
    }

    // Incrementing the version invalidates every token issued for this user
    // before this successful login.
    const loggedInUser = await prisma.user.update({
      where: { id: user.id },
      data: { tokenVersion: { increment: 1 } },
      select: {
        id: true,
        email: true,
        roles: true,
        tokenVersion: true,
        createdAt: true
      }
    });

    return sendSuccess(res, {
      message: "Login successful",
      data: {
        user: sanitizeUser(loggedInUser),
        token: createToken(loggedInUser)
      }
    });
  } catch (error) {
    if (error.code === "P2002") {
      return sendError(res, {
        statusCode: 409,
        message: "Email already exists",
        errors: { email: ["Email already exists."] }
      });
    }

    return next(error);
  }
}

module.exports = {
  login,
  signup
};
