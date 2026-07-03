const { prisma } = require("../config/prisma");
const {
  addValidationError,
  hasValidationErrors,
  isValidEmail,
  sendValidationError
} = require("../utils/validation");

function readOptionalString(value) {
  if (value === undefined) {
    return undefined;
  }

  const normalized = String(value || "").trim();
  return normalized || null;
}

async function listCustomers(req, res, next) {
  try {
    const customers = await prisma.customer.findMany({
      orderBy: { createdAt: "desc" }
    });

    return res.json({ customers });
  } catch (error) {
    return next(error);
  }
}

async function createCustomer(req, res, next) {
  try {
    const name = String(req.body.name || "").trim();
    const email = readOptionalString(req.body.email);
    const errors = {};

    if (!name) {
      addValidationError(errors, "name", "Name is required.");
    }

    if (email && !isValidEmail(email)) {
      addValidationError(errors, "email", "Email must be a valid email address.");
    }

    if (hasValidationErrors(errors)) {
      return sendValidationError(res, errors);
    }

    const customer = await prisma.customer.create({
      data: {
        name,
        phone: readOptionalString(req.body.phone),
        email,
        address: readOptionalString(req.body.address)
      }
    });

    return res.status(201).json({ customer });
  } catch (error) {
    return next(error);
  }
}

async function updateCustomer(req, res, next) {
  try {
    const data = {};
    const errors = {};

    if (req.body.name !== undefined) {
      const name = String(req.body.name || "").trim();

      if (!name) {
        addValidationError(errors, "name", "Name cannot be empty.");
      } else {
        data.name = name;
      }
    }

    for (const field of ["phone", "email", "address"]) {
      if (req.body[field] !== undefined) {
        data[field] = readOptionalString(req.body[field]);
      }
    }

    if (data.email && !isValidEmail(data.email)) {
      addValidationError(errors, "email", "Email must be a valid email address.");
    }

    if (Object.keys(data).length === 0) {
      addValidationError(errors, "body", "At least one field is required.");
    }

    if (hasValidationErrors(errors)) {
      return sendValidationError(res, errors);
    }

    const existingCustomer = await prisma.customer.findUnique({
      where: { id: req.params.id },
      select: { id: true }
    });

    if (!existingCustomer) {
      addValidationError(errors, "id", "Customer does not exist.");
      return sendValidationError(res, errors);
    }

    const customer = await prisma.customer.update({
      where: { id: req.params.id },
      data
    });

    return res.json({ customer });
  } catch (error) {
    if (error.code === "P2025") {
      return res.status(404).json({ message: "Customer not found" });
    }

    return next(error);
  }
}

module.exports = {
  listCustomers,
  createCustomer,
  updateCustomer
};
