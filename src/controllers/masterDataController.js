const { prisma } = require("../config/prisma");
const { sendError, sendSuccess } = require("../utils/response");
const {
  addValidationError,
  hasValidationErrors,
  isValidUuid,
  sendValidationError
} = require("../utils/validation");

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
    return sendError(res, {
      statusCode: 404,
      message: "Record not found",
      errors: { id: ["Record not found."] }
    });
  }

  if (error.code === "P2002") {
    return sendError(res, {
      statusCode: 409,
      message: "Record already exists",
      errors: { record: ["Record already exists."] }
    });
  }

  if (error.code === "P2003") {
    return sendError(res, {
      statusCode: 400,
      message: "Related record does not exist",
      errors: { relation: ["Related record does not exist."] }
    });
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

      return sendSuccess(res, {
        message: `${responseKey} fetched`,
        data: { [responseKey]: records }
      });
    } catch (error) {
      return next(error);
    }
  };
}

async function createCategory(req, res, next) {
  try {
    const name = readRequiredString(req.body.name);
    const errors = {};

    if (!name) {
      addValidationError(errors, "name", "Name is required.");
    }

    if (hasValidationErrors(errors)) {
      return sendValidationError(res, errors);
    }

    const existingCategory = await prisma.category.findUnique({
      where: { name },
      select: { id: true }
    });

    if (existingCategory) {
      addValidationError(errors, "name", "Category name already exists.");
      return sendValidationError(res, errors);
    }

    const category = await prisma.category.create({
      data: {
        name,
        description: readOptionalString(req.body.description),
        picture: readOptionalString(req.body.picture)
      }
    });

    return sendSuccess(res, {
      statusCode: 201,
      message: "Category created",
      data: { category }
    });
  } catch (error) {
    return handleMasterDataError(error, res, next);
  }
}

async function updateCategory(req, res, next) {
  try {
    const data = pickOptionalStrings(req.body, ["name", "description", "picture"]);
    const errors = {};

    if (data.name === null) {
      addValidationError(errors, "name", "Name cannot be empty.");
    }

    if (Object.keys(data).length === 0) {
      addValidationError(errors, "body", "At least one field is required.");
    }

    if (hasValidationErrors(errors)) {
      return sendValidationError(res, errors);
    }

    const [existingCategory, duplicateCategory] = await Promise.all([
      prisma.category.findUnique({
        where: { id: req.params.id },
        select: { id: true }
      }),
      data.name
        ? prisma.category.findFirst({
            where: {
              name: data.name,
              NOT: { id: req.params.id }
            },
            select: { id: true }
          })
        : null
    ]);

    if (!existingCategory) {
      addValidationError(errors, "id", "Category does not exist.");
    }

    if (duplicateCategory) {
      addValidationError(errors, "name", "Category name already exists.");
    }

    if (hasValidationErrors(errors)) {
      return sendValidationError(res, errors);
    }

    const category = await prisma.category.update({
      where: { id: req.params.id },
      data
    });

    return sendSuccess(res, {
      message: "Category updated",
      data: { category }
    });
  } catch (error) {
    return handleMasterDataError(error, res, next);
  }
}

async function createSupplier(req, res, next) {
  try {
    const companyName = readRequiredString(req.body.companyName);
    const errors = {};

    if (!companyName) {
      addValidationError(errors, "companyName", "Company name is required.");
    }

    if (hasValidationErrors(errors)) {
      return sendValidationError(res, errors);
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

    return sendSuccess(res, {
      statusCode: 201,
      message: "Supplier created",
      data: { supplier }
    });
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
    const errors = {};

    if (data.companyName === null) {
      addValidationError(errors, "companyName", "Company name cannot be empty.");
    }

    if (Object.keys(data).length === 0) {
      addValidationError(errors, "body", "At least one field is required.");
    }

    if (hasValidationErrors(errors)) {
      return sendValidationError(res, errors);
    }

    const existingSupplier = await prisma.supplier.findUnique({
      where: { id: req.params.id },
      select: { id: true }
    });

    if (!existingSupplier) {
      addValidationError(errors, "id", "Supplier does not exist.");
      return sendValidationError(res, errors);
    }

    const supplier = await prisma.supplier.update({
      where: { id: req.params.id },
      data
    });

    return sendSuccess(res, {
      message: "Supplier updated",
      data: { supplier }
    });
  } catch (error) {
    return handleMasterDataError(error, res, next);
  }
}

async function createDeliveryCompany(req, res, next) {
  try {
    const companyName = readRequiredString(req.body.companyName);
    const errors = {};

    if (!companyName) {
      addValidationError(errors, "companyName", "Company name is required.");
    }

    if (hasValidationErrors(errors)) {
      return sendValidationError(res, errors);
    }

    const deliveryCompany = await prisma.deliveryCompany.create({
      data: {
        companyName,
        phone: readOptionalString(req.body.phone),
        trackingUrl: readOptionalString(req.body.trackingUrl)
      }
    });

    return sendSuccess(res, {
      statusCode: 201,
      message: "Delivery company created",
      data: { deliveryCompany }
    });
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
    const errors = {};

    if (data.companyName === null) {
      addValidationError(errors, "companyName", "Company name cannot be empty.");
    }

    if (Object.keys(data).length === 0) {
      addValidationError(errors, "body", "At least one field is required.");
    }

    if (hasValidationErrors(errors)) {
      return sendValidationError(res, errors);
    }

    const existingDeliveryCompany = await prisma.deliveryCompany.findUnique({
      where: { id: req.params.id },
      select: { id: true }
    });

    if (!existingDeliveryCompany) {
      addValidationError(errors, "id", "Delivery company does not exist.");
      return sendValidationError(res, errors);
    }

    const deliveryCompany = await prisma.deliveryCompany.update({
      where: { id: req.params.id },
      data
    });

    return sendSuccess(res, {
      message: "Delivery company updated",
      data: { deliveryCompany }
    });
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
    const reportsToId = readOptionalString(req.body.reportsToId);
    const errors = {};

    if (!firstName) {
      addValidationError(errors, "firstName", "First name is required.");
    }

    if (!lastName) {
      addValidationError(errors, "lastName", "Last name is required.");
    }

    if (birthDate === null) {
      addValidationError(
        errors,
        "birthDate",
        "Birth date must be a valid date when provided."
      );
    }

    if (hireDate === null) {
      addValidationError(
        errors,
        "hireDate",
        "Hire date must be a valid date when provided."
      );
    }

    if (reportsToId && !isValidUuid(reportsToId)) {
      addValidationError(errors, "reportsToId", "Reports-to ID must be a valid UUID.");
    }

    if (hasValidationErrors(errors)) {
      return sendValidationError(res, errors);
    }

    if (reportsToId) {
      const manager = await prisma.employee.findUnique({
        where: { id: reportsToId },
        select: { id: true }
      });

      if (!manager) {
        addValidationError(errors, "reportsToId", "Reports-to employee does not exist.");
        return sendValidationError(res, errors);
      }
    }

    const employee = await prisma.employee.create({
      data: {
        firstName,
        lastName,
        birthDate,
        hireDate,
        reportsToId,
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

    return sendSuccess(res, {
      statusCode: 201,
      message: "Employee created",
      data: { employee }
    });
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
    const errors = {};

    for (const field of ["firstName", "lastName"]) {
      if (data[field] === null) {
        addValidationError(errors, field, `${field} cannot be empty.`);
      }
    }

    for (const field of ["birthDate", "hireDate"]) {
      if (req.body[field] !== undefined) {
        const value = readOptionalDate(req.body[field]);

        if (value === null) {
          addValidationError(
            errors,
            field,
            `${field} must be a valid date when provided.`
          );
        } else {
          data[field] = value;
        }
      }
    }

    if (data.reportsToId && !isValidUuid(data.reportsToId)) {
      addValidationError(errors, "reportsToId", "Reports-to ID must be a valid UUID.");
    }

    if (Object.keys(data).length === 0) {
      addValidationError(errors, "body", "At least one field is required.");
    }

    if (hasValidationErrors(errors)) {
      return sendValidationError(res, errors);
    }

    const [existingEmployee, manager] = await Promise.all([
      prisma.employee.findUnique({
        where: { id: req.params.id },
        select: { id: true }
      }),
      data.reportsToId
        ? prisma.employee.findUnique({
            where: { id: data.reportsToId },
            select: { id: true }
          })
        : null
    ]);

    if (!existingEmployee) {
      addValidationError(errors, "id", "Employee does not exist.");
    }

    if (data.reportsToId === req.params.id) {
      addValidationError(errors, "reportsToId", "Employee cannot report to themselves.");
    } else if (data.reportsToId && !manager) {
      addValidationError(errors, "reportsToId", "Reports-to employee does not exist.");
    }

    if (hasValidationErrors(errors)) {
      return sendValidationError(res, errors);
    }

    const employee = await prisma.employee.update({
      where: { id: req.params.id },
      data
    });

    return sendSuccess(res, {
      message: "Employee updated",
      data: { employee }
    });
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
