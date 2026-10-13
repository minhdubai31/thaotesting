const { prisma } = require("../config/prisma");
const { sendError, sendSuccess } = require("../utils/response");
const { buildMeta, parsePagination, readSearch } = require("../utils/pagination");
const { isValidUuid } = require("../utils/validation");

// Public catalog: only active, non-discontinued products are shown.
const storeSorts = {
  newest: { createdAt: "desc" },
  price_asc: { price: "asc" },
  price_desc: { price: "desc" },
  rating: { ratingAverage: "desc" },
  name: { name: "asc" }
};

function positiveNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : null;
}

function publicProduct(product) {
  return {
    id: product.id,
    slug: product.slug,
    sku: product.sku,
    name: product.name,
    brand: product.brand,
    model: product.model,
    price: product.price,
    imageUrl: product.imageUrl,
    gallery: product.gallery,
    description: product.description,
    specs: product.specs,
    ratingAverage: product.ratingAverage,
    reviewCount: product.reviewCount,
    inStock: product.unitsInStock > 0,
    category: product.categoryRef
      ? { id: product.categoryRef.id, name: product.categoryRef.name, slug: product.categoryRef.slug }
      : null
  };
}

const productInclude = { categoryRef: true };

async function listStoreProducts(req, res, next) {
  try {
    const { page, pageSize, skip, take } = parsePagination(req.query);
    const q = readSearch(req.query.q);
    const where = { isActive: true, discontinued: false };

    if (q) {
      where.OR = ["name", "sku", "brand", "model"].map((field) => ({
        [field]: { contains: q, mode: "insensitive" }
      }));
    }

    if (req.query.category) {
      where.categoryRef = { slug: String(req.query.category) };
    }

    if (req.query.brand) {
      where.brand = { equals: String(req.query.brand), mode: "insensitive" };
    }

    const minPrice = positiveNumber(req.query.minPrice);
    const maxPrice = positiveNumber(req.query.maxPrice);
    if (minPrice !== null || maxPrice !== null) {
      where.price = {};
      if (minPrice !== null) where.price.gte = minPrice;
      if (maxPrice !== null) where.price.lte = maxPrice;
    }

    const sort = storeSorts[req.query.sort] || storeSorts.newest;

    const [products, total] = await prisma.$transaction([
      prisma.product.findMany({ where, skip, take, orderBy: sort, include: productInclude }),
      prisma.product.count({ where })
    ]);

    return sendSuccess(res, {
      message: "Products fetched",
      data: { products: products.map(publicProduct), meta: buildMeta({ page, pageSize, total }) }
    });
  } catch (error) {
    return next(error);
  }
}

async function getStoreProduct(req, res, next) {
  try {
    const product = await prisma.product.findFirst({
      where: { slug: req.params.slug, isActive: true, discontinued: false },
      include: {
        categoryRef: true,
        reviews: {
          orderBy: { createdAt: "desc" },
          take: 10,
          include: { user: { select: { username: true, email: true } } }
        }
      }
    });

    if (!product) {
      return sendError(res, {
        statusCode: 404,
        message: "Product not found",
        errors: { slug: ["Product not found."] }
      });
    }

    const related = await prisma.product.findMany({
      where: {
        isActive: true,
        discontinued: false,
        categoryId: product.categoryId,
        NOT: { id: product.id }
      },
      take: 4,
      orderBy: { ratingAverage: "desc" },
      include: productInclude
    });

    return sendSuccess(res, {
      message: "Product fetched",
      data: {
        product: {
          ...publicProduct(product),
          reviews: product.reviews.map((review) => ({
            id: review.id,
            rating: review.rating,
            title: review.title,
            body: review.body,
            createdAt: review.createdAt,
            author: review.user.username || review.user.email.split("@")[0]
          }))
        },
        related: related.map(publicProduct)
      }
    });
  } catch (error) {
    return next(error);
  }
}

async function listStoreCategories(req, res, next) {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: "asc" },
      include: { _count: { select: { products: { where: { isActive: true } } } } }
    });

    return sendSuccess(res, {
      message: "Categories fetched",
      data: {
        categories: categories.map((category) => ({
          id: category.id,
          name: category.name,
          slug: category.slug,
          description: category.description,
          picture: category.picture,
          productCount: category._count.products
        }))
      }
    });
  } catch (error) {
    return next(error);
  }
}

async function listStoreBrands(req, res, next) {
  try {
    const rows = await prisma.product.findMany({
      where: { isActive: true, discontinued: false },
      distinct: ["brand"],
      select: { brand: true },
      orderBy: { brand: "asc" }
    });

    return sendSuccess(res, {
      message: "Brands fetched",
      data: { brands: rows.map((row) => row.brand) }
    });
  } catch (error) {
    return next(error);
  }
}

// A review is allowed only after the customer has a completed order with this product.
async function createReview(req, res, next) {
  try {
    const rating = Number(req.body.rating);
    const title = readSearch(req.body.title);
    const body = readSearch(req.body.body);

    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return sendError(res, {
        statusCode: 400,
        message: "Validation failed",
        errors: { rating: ["Rating must be a whole number from 1 to 5."] }
      });
    }

    const product = await prisma.product.findUnique({
      where: { slug: req.params.slug },
      select: { id: true }
    });

    if (!product) {
      return sendError(res, {
        statusCode: 404,
        message: "Product not found",
        errors: { slug: ["Product not found."] }
      });
    }

    const purchase = await prisma.orderItem.findFirst({
      where: {
        productId: product.id,
        order: { placedById: req.user.id, status: "completed" }
      },
      select: { id: true }
    });

    if (!purchase) {
      return sendError(res, {
        statusCode: 403,
        message: "Only customers who received this product can review it",
        errors: { product: ["Buy and receive this product before reviewing it."] }
      });
    }

    const review = await prisma.$transaction(async (tx) => {
      const created = await tx.review.create({
        data: { productId: product.id, userId: req.user.id, rating, title, body }
      });

      const summary = await tx.review.aggregate({
        where: { productId: product.id },
        _avg: { rating: true },
        _count: { _all: true }
      });

      await tx.product.update({
        where: { id: product.id },
        data: {
          ratingAverage: Number((summary._avg.rating || 0).toFixed(2)),
          reviewCount: summary._count._all
        }
      });

      return created;
    });

    return sendSuccess(res, {
      statusCode: 201,
      message: "Review added",
      data: { review }
    });
  } catch (error) {
    if (error.code === "P2002") {
      return sendError(res, {
        statusCode: 409,
        message: "You already reviewed this product",
        errors: { product: ["You already reviewed this product."] }
      });
    }

    return next(error);
  }
}

module.exports = {
  createReview,
  getStoreProduct,
  listStoreBrands,
  listStoreCategories,
  listStoreProducts
};
