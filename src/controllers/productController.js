const { prisma } = require("../config/prisma");
const {
  addValidationError,
  hasValidationErrors,
  isValidUuid,
  sendValidationError
} = require("../utils/validation");

function parsePrice(value) {
  const price = Number(value);
  return Number.isFinite(price) && price >= 0 ? price : null;
}

function parseNonNegativeInteger(value, fallback = null) {
  if (value === undefined) {
    return fallback;
  }

  const quantity = Number(value);
  return Number.isInteger(quantity) && quantity >= 0 ? quantity : null;
}

function readOptionalString(value) {
  if (value === undefined) {
    return undefined;
  }

  const normalized = String(value || "").trim();
  return normalized || null;
}

function readOptionalId(value) {
  if (value === undefined) {
    return undefined;
  }

  return String(value || "").trim() || null;
}

function parseOptionalBoolean(value, fallback) {
  if (value === undefined) {
    return fallback;
  }

  if (typeof value === "boolean") {
    return value;
  }

  if (value === "true") {
    return true;
  }

  if (value === "false") {
    return false;
  }

  return null;
}

const productInclude = {
  categoryRef: true,
  supplier: true,
  inventory: true
};

async function listProducts(req, res, next) {
  try {
    const products = await prisma.product.findMany({
      orderBy: { createdAt: "desc" },
      include: productInclude
    });

    return res.json({ products });
  } catch (error) {
    return next(error);
  }
}

async function createProduct(req, res, next) {
  try {
    const sku = String(req.body.sku || "").trim();
    const name = String(req.body.name || "").trim();
    const brand = String(req.body.brand || "").trim();
    const model = String(req.body.model || "").trim();
    const category = String(req.body.category || "phone").trim();
    const price = parsePrice(req.body.price ?? req.body.unitPrice);
    const quantity = parseNonNegativeInteger(
      req.body.quantity ?? req.body.unitsInStock,
      0
    );
    const unitsOnOrder = parseNonNegativeInteger(req.body.unitsOnOrder, 0);
    const reorderLevel = parseNonNegativeInteger(req.body.reorderLevel, 0);
    const categoryId = readOptionalId(req.body.categoryId);
    const supplierId = readOptionalId(req.body.supplierId);
    const discontinued = parseOptionalBoolean(req.body.discontinued, false);
    const isActive = parseOptionalBoolean(req.body.isActive, true);
    const errors = {};

    for (const [field, value] of Object.entries({ sku, name, brand, model })) {
      if (!value) {
        addValidationError(errors, field, `${field} is required.`);
      }
    }

    if (!category) {
      addValidationError(errors, "category", "Category cannot be empty.");
    }

    if (price === null) {
      addValidationError(errors, "price", "Price must be a non-negative number.");
    }

    if (quantity === null) {
      addValidationError(
        errors,
        "unitsInStock",
        "Stock quantity must be a non-negative integer."
      );
    }

    if (unitsOnOrder === null) {
      addValidationError(
        errors,
        "unitsOnOrder",
        "Units on order must be a non-negative integer."
      );
    }

    if (reorderLevel === null) {
      addValidationError(
        errors,
        "reorderLevel",
        "Reorder level must be a non-negative integer."
      );
    }

    if (categoryId && !isValidUuid(categoryId)) {
      addValidationError(errors, "categoryId", "Category ID must be a valid UUID.");
    }

    if (supplierId && !isValidUuid(supplierId)) {
      addValidationError(errors, "supplierId", "Supplier ID must be a valid UUID.");
    }

    if (discontinued === null) {
      addValidationError(errors, "discontinued", "Discontinued must be a boolean.");
    }

    if (isActive === null) {
      addValidationError(errors, "isActive", "isActive must be a boolean.");
    }

    if (hasValidationErrors(errors)) {
      return sendValidationError(res, errors);
    }

    const product = await prisma.product.create({
      data: {
        sku,
        name,
        brand,
        model,
        category,
        categoryId,
        supplierId,
        quantityPerUnit: readOptionalString(req.body.quantityPerUnit),
        price,
        unitsInStock: quantity,
        unitsOnOrder,
        reorderLevel,
        discontinued,
        isActive,
        inventory: {
          create: { quantity }
        }
      },
      include: productInclude
    });

    return res.status(201).json({ product });
  } catch (error) {
    if (error.code === "P2002") {
      return res.status(409).json({ message: "SKU already exists" });
    }

    if (error.code === "P2003") {
      return res.status(400).json({ message: "Category or supplier not found" });
    }

    return next(error);
  }
}

async function updateProduct(req, res, next) {
  try {
    const data = {};
    const stringFields = ["sku", "name", "brand", "model", "category"];
    const errors = {};

    for (const field of stringFields) {
      if (req.body[field] !== undefined) {
        const value = String(req.body[field] || "").trim();

        if (!value) {
          addValidationError(errors, field, `${field} cannot be empty.`);
        } else {
          data[field] = value;
        }
      }
    }

    if (req.body.price !== undefined) {
      const price = parsePrice(req.body.price);

      if (price === null) {
        addValidationError(errors, "price", "Price must be a non-negative number.");
      } else {
        data.price = price;
      }
    }

    if (req.body.unitPrice !== undefined) {
      const price = parsePrice(req.body.unitPrice);

      if (price === null) {
        addValidationError(
          errors,
          "unitPrice",
          "Unit price must be a non-negative number."
        );
      } else {
        data.price = price;
      }
    }

    for (const field of ["unitsInStock", "unitsOnOrder", "reorderLevel"]) {
      if (req.body[field] !== undefined) {
        const value = parseNonNegativeInteger(req.body[field]);

        if (value === null) {
          addValidationError(
            errors,
            field,
            `${field} must be a non-negative integer.`
          );
        } else {
          data[field] = value;
        }
      }
    }

    for (const field of ["categoryId", "supplierId", "quantityPerUnit"]) {
      if (req.body[field] !== undefined) {
        data[field] =
          field === "quantityPerUnit"
            ? readOptionalString(req.body[field])
            : readOptionalId(req.body[field]);
      }
    }

    if (data.categoryId && !isValidUuid(data.categoryId)) {
      addValidationError(errors, "categoryId", "Category ID must be a valid UUID.");
    }

    if (data.supplierId && !isValidUuid(data.supplierId)) {
      addValidationError(errors, "supplierId", "Supplier ID must be a valid UUID.");
    }

    if (req.body.discontinued !== undefined) {
      const discontinued = parseOptionalBoolean(req.body.discontinued);

      if (discontinued === null) {
        addValidationError(errors, "discontinued", "Discontinued must be a boolean.");
      } else {
        data.discontinued = discontinued;
      }
    }

    if (req.body.isActive !== undefined) {
      const isActive = parseOptionalBoolean(req.body.isActive);

      if (isActive === null) {
        addValidationError(errors, "isActive", "isActive must be a boolean.");
      } else {
        data.isActive = isActive;
      }
    }

    if (Object.keys(data).length === 0) {
      addValidationError(errors, "body", "At least one field is required.");
    }

    if (hasValidationErrors(errors)) {
      return sendValidationError(res, errors);
    }

    const product = await prisma.$transaction(async (tx) => {
      const updatedProduct = await tx.product.update({
        where: { id: req.params.id },
        data,
        include: productInclude
      });

      if (data.unitsInStock !== undefined) {
        await tx.inventoryItem.upsert({
          where: { productId: req.params.id },
          create: { productId: req.params.id, quantity: data.unitsInStock },
          update: { quantity: data.unitsInStock }
        });
      }

      return tx.product.findUnique({
        where: { id: updatedProduct.id },
        include: productInclude
      });
    });

    return res.json({ product });
  } catch (error) {
    if (error.code === "P2025") {
      return res.status(404).json({ message: "Product not found" });
    }

    if (error.code === "P2002") {
      return res.status(409).json({ message: "SKU already exists" });
    }

    if (error.code === "P2003") {
      return res.status(400).json({ message: "Category or supplier not found" });
    }

    return next(error);
  }
}

async function deleteProduct(req, res, next) {
  try {
    await prisma.product.update({
      where: { id: req.params.id },
      data: { isActive: false }
    });

    return res.status(204).send();
  } catch (error) {
    if (error.code === "P2025") {
      return res.status(404).json({ message: "Product not found" });
    }

    return next(error);
  }
}

module.exports = {
  listProducts,
  createProduct,
  updateProduct,
  deleteProduct
};
