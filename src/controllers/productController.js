const { prisma } = require("../config/prisma");
const { sendError, sendSuccess } = require("../utils/response");
const { buildMeta, parsePagination, parseSort, readSearch } = require("../utils/pagination");
const { slugify } = require("../utils/ecommerce");
const { IMAGE_DATA_URL, MAX_IMAGE_LENGTH, withPublicImage } = require("../utils/productImage");
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

// Accepts a web link or an uploaded image. Returns undefined when the field was not sent,
// or when the form sends back the image URL the API gave it (nothing changed).
function readImageUrl(value, errors) {
  if (value === undefined) {
    return undefined;
  }

  const text = readOptionalString(value);

  if (!text) {
    return null;
  }

  if (text.startsWith("/api/products/")) {
    return undefined;
  }

  if (text.startsWith("data:")) {
    if (!IMAGE_DATA_URL.test(text)) {
      addValidationError(errors, "imageUrl", "Image must be a JPEG, PNG or WebP file.");
    } else if (text.length > MAX_IMAGE_LENGTH) {
      addValidationError(errors, "imageUrl", "Image is too large. Upload a smaller file.");
    }
    return text;
  }

  if (!/^https?:\/\//i.test(text)) {
    addValidationError(errors, "imageUrl", "Image must be a web link or an uploaded image.");
  }
  return text;
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
    const { page, pageSize, skip, take } = parsePagination(req.query);
    const q = readSearch(req.query.q);
    const categoryId = readOptionalId(req.query.categoryId);
    const status = String(req.query.status || "all").toLowerCase();
    const where = {};

    if (q) {
      where.OR = ["name", "sku", "brand", "model"].map((field) => ({
        [field]: { contains: q, mode: "insensitive" }
      }));
    }

    if (categoryId && isValidUuid(categoryId)) {
      where.categoryId = categoryId;
    }

    if (status === "active") where.isActive = true;
    if (status === "inactive") where.isActive = false;

    const [products, total] = await prisma.$transaction([
      prisma.product.findMany({
        where,
        skip,
        take,
        orderBy: parseSort(req.query, ["name", "price", "unitsInStock", "createdAt", "sku"], "createdAt"),
        include: productInclude
      }),
      prisma.product.count({ where })
    ]);

    return sendSuccess(res, {
      message: "Products fetched",
      data: { products: products.map(withPublicImage), meta: buildMeta({ page, pageSize, total }) }
    });
  } catch (error) {
    return next(error);
  }
}

async function getProduct(req, res, next) {
  try {
    const product = await prisma.product.findUnique({
      where: { id: req.params.id },
      include: productInclude
    });

    if (!product) {
      return sendError(res, {
        statusCode: 404,
        message: "Product not found",
        errors: { product: ["Product not found."] }
      });
    }

    return sendSuccess(res, {
      message: "Product fetched",
      data: { product: withPublicImage(product) }
    });
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

    const [existingProduct, categoryRecord, supplierRecord] = await Promise.all([
      prisma.product.findUnique({
        where: { sku },
        select: { id: true }
      }),
      categoryId
        ? prisma.category.findUnique({
            where: { id: categoryId },
            select: { id: true }
          })
        : null,
      supplierId
        ? prisma.supplier.findUnique({
            where: { id: supplierId },
            select: { id: true }
          })
        : null
    ]);

    if (existingProduct) {
      addValidationError(errors, "sku", "SKU already exists.");
    }

    if (categoryId && !categoryRecord) {
      addValidationError(errors, "categoryId", "Category does not exist.");
    }

    if (supplierId && !supplierRecord) {
      addValidationError(errors, "supplierId", "Supplier does not exist.");
    }

    const imageUrl = readImageUrl(req.body.imageUrl, errors);

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
        slug: slugify(sku),
        description: readOptionalString(req.body.description),
        imageUrl,
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

    return sendSuccess(res, {
      statusCode: 201,
      message: "Product created",
      data: { product: withPublicImage(product) }
    });
  } catch (error) {
    if (error.code === "P2002") {
      return sendError(res, {
        statusCode: 409,
        message: "SKU already exists",
        errors: { sku: ["SKU already exists."] }
      });
    }

    if (error.code === "P2003") {
      return sendError(res, {
        statusCode: 400,
        message: "Related record not found",
        errors: { relation: ["Category or supplier not found."] }
      });
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

    if (req.body.description !== undefined) {
      data.description = readOptionalString(req.body.description);
    }

    if (req.body.imageUrl !== undefined) {
      data.imageUrl = readImageUrl(req.body.imageUrl, errors);
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

    const [existingProduct, duplicateSku, categoryRecord, supplierRecord] =
      await Promise.all([
        prisma.product.findUnique({
          where: { id: req.params.id },
          select: { id: true }
        }),
        data.sku
          ? prisma.product.findFirst({
              where: {
                sku: data.sku,
                NOT: { id: req.params.id }
              },
              select: { id: true }
            })
          : null,
        data.categoryId
          ? prisma.category.findUnique({
              where: { id: data.categoryId },
              select: { id: true }
            })
          : null,
        data.supplierId
          ? prisma.supplier.findUnique({
              where: { id: data.supplierId },
              select: { id: true }
            })
          : null
      ]);

    if (!existingProduct) {
      addValidationError(errors, "id", "Product does not exist.");
    }

    if (duplicateSku) {
      addValidationError(errors, "sku", "SKU already exists.");
    }

    if (data.categoryId && !categoryRecord) {
      addValidationError(errors, "categoryId", "Category does not exist.");
    }

    if (data.supplierId && !supplierRecord) {
      addValidationError(errors, "supplierId", "Supplier does not exist.");
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

    return sendSuccess(res, {
      message: "Product updated",
      data: { product: withPublicImage(product) }
    });
  } catch (error) {
    if (error.code === "P2025") {
      return sendError(res, {
        statusCode: 404,
        message: "Product not found",
        errors: { id: ["Product not found."] }
      });
    }

    if (error.code === "P2002") {
      return sendError(res, {
        statusCode: 409,
        message: "SKU already exists",
        errors: { sku: ["SKU already exists."] }
      });
    }

    if (error.code === "P2003") {
      return sendError(res, {
        statusCode: 400,
        message: "Related record not found",
        errors: { relation: ["Category or supplier not found."] }
      });
    }

    return next(error);
  }
}

async function deleteProduct(req, res, next) {
  try {
    const existingProduct = await prisma.product.findUnique({
      where: { id: req.params.id },
      select: { id: true }
    });

    if (!existingProduct) {
      const errors = {};
      addValidationError(errors, "id", "Product does not exist.");
      return sendValidationError(res, errors);
    }

    await prisma.product.update({
      where: { id: req.params.id },
      data: { isActive: false }
    });

    return sendSuccess(res, {
      message: "Product deleted",
      data: null
    });
  } catch (error) {
    if (error.code === "P2025") {
      return sendError(res, {
        statusCode: 404,
        message: "Product not found",
        errors: { id: ["Product not found."] }
      });
    }

    return next(error);
  }
}

// Serves an uploaded photo as a real image so the browser can cache it.
async function getProductImage(req, res, next) {
  try {
    const product = await prisma.product.findUnique({
      where: { id: req.params.id },
      select: { imageUrl: true }
    });
    const match = product?.imageUrl?.match(IMAGE_DATA_URL);

    if (!match) {
      return sendError(res, {
        statusCode: 404,
        message: "Image not found",
        errors: { image: ["This product has no uploaded image."] }
      });
    }

    res.set("Cache-Control", "public, max-age=86400");
    res.type(match[1]).send(Buffer.from(match[2], "base64"));
    return undefined;
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  getProduct,
  getProductImage,
  listProducts,
  createProduct,
  updateProduct,
  deleteProduct
};
