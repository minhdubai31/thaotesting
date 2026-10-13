const { prisma } = require("../config/prisma");
const { sendError, sendSuccess } = require("../utils/response");
const { buildMeta, parsePagination, readSearch } = require("../utils/pagination");

const revenueStatuses = ["paid", "shipped", "completed"];

// ----- coupons -----

function parseCouponInput(body, { partial = false } = {}) {
  const data = {};
  const errors = {};

  if (!partial || body.code !== undefined) {
    const code = readSearch(body.code)?.toUpperCase();
    if (!code || !/^[A-Z0-9_-]{3,30}$/.test(code)) errors.code = ["Code must be 3-30 letters, numbers, - or _."];
    data.code = code;
  }

  if (!partial || body.type !== undefined) {
    if (!["percent", "fixed"].includes(body.type)) errors.type = ["Type must be percent or fixed."];
    else if (body.type === "percent" && !(Number(body.value) > 0 && Number(body.value) <= 100)) {
      errors.value = ["Percent value must be between 1 and 100."];
    }
    data.type = body.type;
  }

  if (!partial || body.value !== undefined) {
    const value = Number(body.value);
    if (!Number.isFinite(value) || value <= 0) errors.value = ["Value must be a positive number."];
    data.value = value;
  }

  if (body.minSubtotal !== undefined) data.minSubtotal = Math.max(0, Number(body.minSubtotal) || 0);
  if (body.usageLimit !== undefined) data.usageLimit = body.usageLimit === null || body.usageLimit === "" ? null : Number(body.usageLimit);
  if (body.description !== undefined) data.description = readSearch(body.description);
  if (body.active !== undefined) data.active = Boolean(body.active);
  if (body.startsAt !== undefined) data.startsAt = body.startsAt ? new Date(body.startsAt) : null;
  if (body.endsAt !== undefined) data.endsAt = body.endsAt ? new Date(body.endsAt) : null;

  return { data, errors };
}

async function listCoupons(req, res, next) {
  try {
    const { page, pageSize, skip, take } = parsePagination(req.query);
    const q = readSearch(req.query.q);
    const where = q ? { code: { contains: q.toUpperCase() } } : {};

    const [coupons, total] = await prisma.$transaction([
      prisma.coupon.findMany({ where, skip, take, orderBy: { createdAt: "desc" } }),
      prisma.coupon.count({ where })
    ]);

    return sendSuccess(res, { message: "Coupons fetched", data: { coupons, meta: buildMeta({ page, pageSize, total }) } });
  } catch (error) {
    return next(error);
  }
}

async function createCoupon(req, res, next) {
  try {
    const { data, errors } = parseCouponInput(req.body);
    if (Object.keys(errors).length) {
      return sendError(res, { statusCode: 400, message: "Validation failed", errors });
    }

    const coupon = await prisma.coupon.create({ data });
    return sendSuccess(res, { statusCode: 201, message: "Coupon created", data: { coupon } });
  } catch (error) {
    if (error.code === "P2002") {
      return sendError(res, { statusCode: 409, message: "Coupon code already exists", errors: { code: ["Coupon code already exists."] } });
    }
    return next(error);
  }
}

async function updateCoupon(req, res, next) {
  try {
    const { data, errors } = parseCouponInput(req.body, { partial: true });
    if (Object.keys(errors).length) {
      return sendError(res, { statusCode: 400, message: "Validation failed", errors });
    }

    const coupon = await prisma.coupon.update({ where: { id: req.params.id }, data });
    return sendSuccess(res, { message: "Coupon updated", data: { coupon } });
  } catch (error) {
    if (error.code === "P2025") {
      return sendError(res, { statusCode: 404, message: "Coupon not found", errors: { id: ["Coupon not found."] } });
    }
    return next(error);
  }
}

// ----- analytics -----

function dayKey(date) {
  return new Date(date).toISOString().slice(0, 10);
}

async function getAnalyticsSummary(req, res, next) {
  try {
    const since = new Date();
    since.setDate(since.getDate() - 13);
    since.setHours(0, 0, 0, 0);

    const [statusCounts, recentOrders, topLines, products, customers] = await Promise.all([
      prisma.order.groupBy({ by: ["status"], _count: { _all: true } }),
      prisma.order.findMany({
        where: { orderDate: { gte: since }, status: { in: revenueStatuses } },
        select: { orderDate: true, totalAmount: true }
      }),
      prisma.orderItem.groupBy({
        by: ["productId"],
        where: { order: { status: { in: revenueStatuses } } },
        _sum: { quantity: true, lineTotal: true },
        orderBy: { _sum: { lineTotal: "desc" } },
        take: 5
      }),
      prisma.product.findMany({
        where: { isActive: true },
        select: { id: true, name: true, sku: true, unitsInStock: true, reorderLevel: true }
      }),
      prisma.customer.count()
    ]);

    const revenueByDay = {};
    for (let i = 0; i < 14; i += 1) {
      const day = new Date(since);
      day.setDate(since.getDate() + i);
      revenueByDay[dayKey(day)] = 0;
    }
    for (const order of recentOrders) {
      const key = dayKey(order.orderDate);
      revenueByDay[key] = (revenueByDay[key] || 0) + Number(order.totalAmount);
    }

    const productNames = new Map(products.map((product) => [product.id, product]));
    const byStatus = Object.fromEntries(statusCounts.map((row) => [row.status, row._count._all]));
    const revenueRows = await prisma.order.aggregate({
      where: { status: { in: revenueStatuses } },
      _sum: { totalAmount: true },
      _count: { _all: true }
    });

    const revenue = Number(revenueRows._sum.totalAmount || 0);
    const paidOrders = revenueRows._count._all;

    return sendSuccess(res, {
      message: "Analytics fetched",
      data: {
        totals: {
          revenue,
          paidOrders,
          averageOrderValue: paidOrders ? revenue / paidOrders : 0,
          customers,
          products: products.length
        },
        ordersByStatus: byStatus,
        revenueByDay: Object.entries(revenueByDay).map(([date, amount]) => ({ date, amount })),
        topProducts: topLines.map((line) => ({
          productId: line.productId,
          name: productNames.get(line.productId)?.name || "Unknown product",
          quantity: line._sum.quantity || 0,
          revenue: Number(line._sum.lineTotal || 0)
        })),
        lowStock: products
          .filter((product) => product.unitsInStock <= product.reorderLevel)
          .sort((a, b) => a.unitsInStock - b.unitsInStock)
          .slice(0, 10)
          .map((product) => ({
            id: product.id,
            name: product.name,
            sku: product.sku,
            unitsInStock: product.unitsInStock,
            reorderLevel: product.reorderLevel
          }))
      }
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  createCoupon,
  getAnalyticsSummary,
  listCoupons,
  updateCoupon
};
