const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { jwtExpiresIn, jwtSecret } = require("../config/env");
const { prisma } = require("../config/prisma");

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
      roles: user.roles || []
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

    if (!email || password.length < 8) {
      return res.status(400).json({
        message: "Email is required and password must be at least 8 characters"
      });
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
        createdAt: true
      }
    });

    return res.status(201).json({
      user: sanitizeUser(user),
      token: createToken(user)
    });
  } catch (error) {
    return next(error);
  }
}

async function login(req, res, next) {
  try {
    const email = normalizeEmail(req.body.email);
    const password = String(req.body.password || "");

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
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
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const isValidPassword = await bcrypt.compare(password, user.passwordHash);

    if (!isValidPassword) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    return res.json({
      user: sanitizeUser(user),
      token: createToken(user)
    });
  } catch (error) {
    if (error.code === "P2002") {
      return res.status(409).json({ message: "Email already exists" });
    }

    return next(error);
  }
}

module.exports = {
  login,
  signup
};
