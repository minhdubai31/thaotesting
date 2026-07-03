const { prisma } = require("../config/prisma");

function readOptionalString(value) {
  if (value === undefined) {
    return undefined;
  }

  const normalized = String(value || "").trim();
  return normalized || null;
}

function readRequiredString(value) {
  const normalized = String(value || "").trim();
  return normalized || null;
}

function readOptionalDate(value) {
  if (value === undefined) {
    return undefined;
  }

  if (value === null || value === "") {
    return null;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function pickOptionalStrings(body, fields) {
  const data = {};

  for (const field of fields) {
    if (body[field] !== undefined) {
      data[field] = readOptionalString(body[field]);
    }
  }

  return data;
}

function handleMasterDataError(error, res, next) {
  if (error.code === "P2025") {
    return res.status(404).json({ message: "Record not found" });
  }

  if (error.code === "P2002") {
    return res.status(409).json({ message: "Record already exists" });
  }

  if (error.code === "P2003") {
    return res.status(400).json({ message: "Related record does not exist" });
  }

  return next(error);
}

function createListHandler(modelName, responseKey, include) {
  return async (req, res, next) => {
    try {
      const records = await prisma[modelName].findMany({
        orderBy: { id: "asc" },
        include
      });

      return res.json({ [responseKey]: records });
    } catch (error) {
      return next(error);
    }
  };
}

async function createCategory(req, res, next) {
  try {
    const name = readRequiredString(req.body.name);

    if (!name) {
      return res.status(400).json({ message: "Name is required" });
    }

    const category = await prisma.category.create({
      data: {
        name,
        description: readOptionalString(req.body.description),
        picture: readOptionalString(req.body.picture)
      }
    });

    return res.status(201).json({ category });
  } catch (error) {
    return handleMasterDataError(error, res, next);
  }
}

async function updateCategory(req, res, next) {
  try {
    const data = pickOptionalStrings(req.body, ["name", "description", "picture"]);

    if (data.name === null) {
      return res.status(400).json({ message: "Name cannot be empty" });
    }

    if (Object.keys(data).length === 0) {
      return res.status(400).json({ message: "At least one field is required" });
    }

    const category = await prisma.category.update({
      where: { id: req.params.id },
      data
    });

    return res.json({ category });
  } catch (error) {
    return handleMasterDataError(error, res, next);
  }
}

async function createSupplier(req, res, next) {
  try {
    const companyName = readRequiredString(req.body.companyName);

    if (!companyName) {
      return res.status(400).json({ message: "companyName is required" });
    }

    const supplier = await prisma.supplier.create({
      data: {
        companyName,
        ...pickOptionalStrings(req.body, [
          "contactName",
          "contactTitle",
          "address",
          "city",
          "region",
          "postalCode",
          "country",
          "phone",
          "fax",
          "homepage"
        ])
      }
    });

    return res.status(201).json({ supplier });
  } catch (error) {
    return handleMasterDataError(error, res, next);
  }
}

async function updateSupplier(req, res, next) {
  try {
    const data = pickOptionalStrings(req.body, [
      "companyName",
      "contactName",
      "contactTitle",
      "address",
      "city",
      "region",
      "postalCode",
      "country",
      "phone",
      "fax",
      "homepage"
    ]);

    if (data.companyName === null) {
      return res.status(400).json({ message: "companyName cannot be empty" });
    }

    if (Object.keys(data).length === 0) {
      return res.status(400).json({ message: "At least one field is required" });
    }

    const supplier = await prisma.supplier.update({
      where: { id: req.params.id },
      data
    });

    return res.json({ supplier });
  } catch (error) {
    return handleMasterDataError(error, res, next);
  }
}

async function createDeliveryCompany(req, res, next) {
  try {
    const companyName = readRequiredString(req.body.companyName);

    if (!companyName) {
      return res.status(400).json({ message: "companyName is required" });
    }

    const deliveryCompany = await prisma.deliveryCompany.create({
      data: {
        companyName,
        phone: readOptionalString(req.body.phone),
        trackingUrl: readOptionalString(req.body.trackingUrl)
      }
    });

    return res.status(201).json({ deliveryCompany });
  } catch (error) {
    return handleMasterDataError(error, res, next);
  }
}

async function updateDeliveryCompany(req, res, next) {
  try {
    const data = pickOptionalStrings(req.body, [
      "companyName",
      "phone",
      "trackingUrl"
    ]);

    if (data.companyName === null) {
      return res.status(400).json({ message: "companyName cannot be empty" });
    }

    if (Object.keys(data).length === 0) {
      return res.status(400).json({ message: "At least one field is required" });
    }

    const deliveryCompany = await prisma.deliveryCompany.update({
      where: { id: req.params.id },
      data
    });

    return res.json({ deliveryCompany });
  } catch (error) {
    return handleMasterDataError(error, res, next);
  }
}

async function createEmployee(req, res, next) {
  try {
    const firstName = readRequiredString(req.body.firstName);
    const lastName = readRequiredString(req.body.lastName);
    const birthDate = readOptionalDate(req.body.birthDate);
    const hireDate = readOptionalDate(req.body.hireDate);

    if (!firstName || !lastName || birthDate === null || hireDate === null) {
      return res.status(400).json({
        message: "firstName, lastName, and valid optional dates are required"
      });
    }

    const employee = await prisma.employee.create({
      data: {
        firstName,
        lastName,
        birthDate,
        hireDate,
        reportsToId: readOptionalString(req.body.reportsToId),
        ...pickOptionalStrings(req.body, [
          "title",
          "titleOfCourtesy",
          "address",
          "city",
          "region",
          "postalCode",
          "country",
          "homePhone",
          "extension",
          "photo",
          "notes",
          "photoPath"
        ])
      }
    });

    return res.status(201).json({ employee });
  } catch (error) {
    return handleMasterDataError(error, res, next);
  }
}

async function updateEmployee(req, res, next) {
  try {
    const data = pickOptionalStrings(req.body, [
      "firstName",
      "lastName",
      "title",
      "titleOfCourtesy",
      "address",
      "city",
      "region",
      "postalCode",
      "country",
      "homePhone",
      "extension",
      "photo",
      "notes",
      "reportsToId",
      "photoPath"
    ]);

    for (const field of ["firstName", "lastName"]) {
      if (data[field] === null) {
        return res.status(400).json({ message: `${field} cannot be empty` });
      }
    }

    for (const field of ["birthDate", "hireDate"]) {
      if (req.body[field] !== undefined) {
        const value = readOptionalDate(req.body[field]);

        if (value === null) {
          return res.status(400).json({ message: `${field} must be a valid date` });
        }

        data[field] = value;
      }
    }

    if (Object.keys(data).length === 0) {
      return res.status(400).json({ message: "At least one field is required" });
    }

    const employee = await prisma.employee.update({
      where: { id: req.params.id },
      data
    });

    return res.json({ employee });
  } catch (error) {
    return handleMasterDataError(error, res, next);
  }
}

module.exports = {
  listCategories: createListHandler("category", "categories"),
  createCategory,
  updateCategory,
  listSuppliers: createListHandler("supplier", "suppliers"),
  createSupplier,
  updateSupplier,
  listDeliveryCompanies: createListHandler(
    "deliveryCompany",
    "deliveryCompanies"
  ),
  createDeliveryCompany,
  updateDeliveryCompany,
  listEmployees: createListHandler("employee", "employees", {
    reportsTo: true
  }),
  createEmployee,
  updateEmployee
};
