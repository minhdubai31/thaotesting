const { prisma } = require("../config/prisma");

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

    if (
      !sku ||
      !name ||
      !brand ||
      !model ||
      price === null ||
      quantity === null ||
      unitsOnOrder === null ||
      reorderLevel === null
    ) {
      return res.status(400).json({
        message:
          "SKU, name, brand, model, non-negative price, stock, on-order quantity, and reorder level are required"
      });
    }

    const product = await prisma.product.create({
      data: {
        sku,
        name,
        brand,
        model,
        category,
        categoryId: readOptionalId(req.body.categoryId),
        supplierId: readOptionalId(req.body.supplierId),
        quantityPerUnit: readOptionalString(req.body.quantityPerUnit),
        price,
        unitsInStock: quantity,
        unitsOnOrder,
        reorderLevel,
        discontinued: Boolean(req.body.discontinued),
        isActive: req.body.isActive === undefined ? true : Boolean(req.body.isActive),
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

    for (const field of stringFields) {
      if (req.body[field] !== undefined) {
        const value = String(req.body[field] || "").trim();

        if (!value) {
          return res.status(400).json({ message: `${field} cannot be empty` });
        }

        data[field] = value;
      }
    }

    if (req.body.price !== undefined) {
      const price = parsePrice(req.body.price);

      if (price === null) {
        return res.status(400).json({ message: "Price must be non-negative" });
      }

      data.price = price;
    }

    if (req.body.unitPrice !== undefined) {
      const price = parsePrice(req.body.unitPrice);

      if (price === null) {
        return res.status(400).json({ message: "Unit price must be non-negative" });
      }

      data.price = price;
    }

    for (const field of ["unitsInStock", "unitsOnOrder", "reorderLevel"]) {
      if (req.body[field] !== undefined) {
        const value = parseNonNegativeInteger(req.body[field]);

        if (value === null) {
          return res.status(400).json({ message: `${field} must be non-negative` });
        }

        data[field] = value;
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

    if (req.body.discontinued !== undefined) {
      data.discontinued = Boolean(req.body.discontinued);
    }

    if (req.body.isActive !== undefined) {
      data.isActive = Boolean(req.body.isActive);
    }

    if (Object.keys(data).length === 0) {
      return res.status(400).json({ message: "At least one field is required" });
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
