const { prisma } = require("../config/prisma");

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

    if (!name) {
      return res.status(400).json({ message: "Name is required" });
    }

    const customer = await prisma.customer.create({
      data: {
        name,
        phone: readOptionalString(req.body.phone),
        email: readOptionalString(req.body.email),
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

    if (req.body.name !== undefined) {
      const name = String(req.body.name || "").trim();

      if (!name) {
        return res.status(400).json({ message: "Name cannot be empty" });
      }

      data.name = name;
    }

    for (const field of ["phone", "email", "address"]) {
      if (req.body[field] !== undefined) {
        data[field] = readOptionalString(req.body[field]);
      }
    }

    if (Object.keys(data).length === 0) {
      return res.status(400).json({ message: "At least one field is required" });
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
