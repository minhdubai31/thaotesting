const { prisma } = require("../config/prisma");
const {
  addValidationError,
  hasValidationErrors,
  isValidUuid,
  sendValidationError
} = require("../utils/validation");

function parseQuantity(value) {
  const quantity = Number(value);
  return Number.isInteger(quantity) && quantity >= 0 ? quantity : null;
}

async function listInventory(req, res, next) {
  try {
    const inventory = await prisma.inventoryItem.findMany({
      orderBy: { updatedAt: "desc" },
      include: {
        product: {
          include: {
            categoryRef: true,
            supplier: true
          }
        }
      }
    });

    return res.json({ inventory });
  } catch (error) {
    return next(error);
  }
}

async function adjustInventory(req, res, next) {
  try {
    const productId = String(req.body.productId || "").trim();
    const type = String(req.body.type || "").trim().toLowerCase();
    const quantity = parseQuantity(req.body.quantity);
    const note =
      req.body.note === undefined ? undefined : String(req.body.note || "").trim();
    const errors = {};

    if (!productId) {
      addValidationError(errors, "productId", "Product ID is required.");
    } else if (!isValidUuid(productId)) {
      addValidationError(errors, "productId", "Product ID must be a valid UUID.");
    }

    if (!type) {
      addValidationError(errors, "type", "Type is required.");
    } else if (!["in", "out", "audit"].includes(type)) {
      addValidationError(errors, "type", "Type must be one of: in, out, audit.");
    }

    if (quantity === null) {
      addValidationError(
        errors,
        "quantity",
        "Quantity must be a non-negative integer."
      );
    }

    if ((type === "in" || type === "out") && quantity === 0) {
      addValidationError(
        errors,
        "quantity",
        "Quantity must be greater than zero for in and out adjustments."
      );
    }

    if (hasValidationErrors(errors)) {
      return sendValidationError(res, errors);
    }

    const existingProduct = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true, isActive: true }
    });

    if (!existingProduct) {
      addValidationError(errors, "productId", "Product does not exist.");
    } else if (!existingProduct.isActive) {
      addValidationError(errors, "productId", "Product is inactive.");
    }

    if (hasValidationErrors(errors)) {
      return sendValidationError(res, errors);
    }

    const result = await prisma.$transaction(async (tx) => {
      const product = await tx.product.findUnique({
        where: { id: productId },
        include: { inventory: true }
      });

      if (!product) {
        const error = new Error("Product not found");
        error.status = 404;
        throw error;
      }

      const currentQuantity = product.inventory ? product.inventory.quantity : 0;
      let nextQuantity = currentQuantity;

      if (type === "in") {
        nextQuantity += quantity;
      }

      if (type === "out") {
        nextQuantity -= quantity;
      }

      if (type === "audit") {
        nextQuantity = quantity;
      }

      if (nextQuantity < 0) {
        const error = new Error("Insufficient stock");
        error.status = 409;
        throw error;
      }

      const inventory = await tx.inventoryItem.upsert({
        where: { productId },
        create: { productId, quantity: nextQuantity },
        update: { quantity: nextQuantity }
      });

      await tx.product.update({
        where: { id: productId },
        data: { unitsInStock: nextQuantity }
      });

      const movement = await tx.stockMovement.create({
        data: {
          productId,
          userId: req.user.id,
          type,
          quantity: nextQuantity - currentQuantity,
          note
        }
      });

      return { inventory, movement };
    });

    return res.status(201).json(result);
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({ message: error.message });
    }

    return next(error);
  }
}

module.exports = {
  listInventory,
  adjustInventory
};
