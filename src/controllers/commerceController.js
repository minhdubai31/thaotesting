const { prisma } = require("../config/prisma");
const { sendError, sendSuccess } = require("../utils/response");
const { buildMeta, parsePagination, readSearch } = require("../utils/pagination");
const { isValidUuid } = require("../utils/validation");
const { publicImageUrl } = require("../utils/productImage");
const {
  couponDiscount,
  couponProblem,
  moveStock,
  shippingFeeFor
} = require("../utils/ecommerce");

const cartInclude = {
  items: {
    orderBy: { createdAt: "asc" },
    include: { product: { include: { categoryRef: true } } }
  }
};

function fail(res, statusCode, message, errors) {
  return sendError(res, { statusCode, message, errors: errors || { cart: [message] } });
}

// Shapes the cart for the storefront and computes totals from current prices.
function serializeCart(cart) {
  const items = (cart?.items || []).map((item) => {
    const price = Number(item.product.price);
    return {
      productId: item.productId,
      slug: item.product.slug,
      name: item.product.name,
      imageUrl: publicImageUrl(item.product),
      unitPrice: price,
      quantity: item.quantity,
      lineTotal: price * item.quantity,
      available: item.product.unitsInStock,
      isActive: item.product.isActive
    };
  });

  const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);

  return {
    items,
    itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
    subtotal,
    shipping: items.length ? shippingFeeFor(subtotal) : 0,
    total: items.length ? subtotal + shippingFeeFor(subtotal) : 0
  };
}

async function findOrCreateCart(userId) {
  return prisma.cart.upsert({
    where: { userId },
    update: {},
    create: { userId },
    include: cartInclude
  });
}

async function getCart(req, res, next) {
  try {
    const cart = await findOrCreateCart(req.user.id);
    return sendSuccess(res, { message: "Cart fetched", data: { cart: serializeCart(cart) } });
  } catch (error) {
    return next(error);
  }
}

// Checks that the requested total quantity fits in stock.
async function checkStock(productId, quantity) {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { isActive: true, unitsInStock: true, name: true }
  });

  if (!product || !product.isActive) return "This product is not available.";
  if (quantity > product.unitsInStock) return `Only ${product.unitsInStock} left for ${product.name}.`;
  return null;
}

async function addCartItem(req, res, next) {
  try {
    const productId = String(req.body.productId || "").trim();
    const quantity = Number(req.body.quantity ?? 1);

    if (!isValidUuid(productId)) return fail(res, 400, "Product ID must be a valid UUID.", { productId: ["Product ID must be a valid UUID."] });
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 99) {
      return fail(res, 400, "Quantity must be between 1 and 99.", { quantity: ["Quantity must be between 1 and 99."] });
    }

    const cart = await findOrCreateCart(req.user.id);
    const existing = cart.items.find((item) => item.productId === productId);
    const total = (existing ? existing.quantity : 0) + quantity;

    const problem = await checkStock(productId, total);
    if (problem) return fail(res, 409, problem);

    await prisma.cartItem.upsert({
      where: { cartId_productId: { cartId: cart.id, productId } },
      update: { quantity: total },
      create: { cartId: cart.id, productId, quantity }
    });

    const updated = await prisma.cart.findUnique({ where: { id: cart.id }, include: cartInclude });
    return sendSuccess(res, { statusCode: 201, message: "Item added to cart", data: { cart: serializeCart(updated) } });
  } catch (error) {
    return next(error);
  }
}

async function updateCartItem(req, res, next) {
  try {
    const quantity = Number(req.body.quantity);
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 99) {
      return fail(res, 400, "Quantity must be between 1 and 99.", { quantity: ["Quantity must be between 1 and 99."] });
    }

    const cart = await findOrCreateCart(req.user.id);
    const item = cart.items.find((line) => line.productId === req.params.productId);
    if (!item) return fail(res, 404, "Item is not in your cart.");

    const problem = await checkStock(req.params.productId, quantity);
    if (problem) return fail(res, 409, problem);

    await prisma.cartItem.update({ where: { id: item.id }, data: { quantity } });

    const updated = await prisma.cart.findUnique({ where: { id: cart.id }, include: cartInclude });
    return sendSuccess(res, { message: "Cart updated", data: { cart: serializeCart(updated) } });
  } catch (error) {
    return next(error);
  }
}

async function removeCartItem(req, res, next) {
  try {
    const cart = await findOrCreateCart(req.user.id);
    await prisma.cartItem.deleteMany({ where: { cartId: cart.id, productId: req.params.productId } });

    const updated = await prisma.cart.findUnique({ where: { id: cart.id }, include: cartInclude });
    return sendSuccess(res, { message: "Item removed", data: { cart: serializeCart(updated) } });
  } catch (error) {
    return next(error);
  }
}

// ----- addresses -----

async function listAddresses(req, res, next) {
  try {
    const addresses = await prisma.address.findMany({
      where: { userId: req.user.id },
      orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }]
    });
    return sendSuccess(res, { message: "Addresses fetched", data: { addresses } });
  } catch (error) {
    return next(error);
  }
}

async function createAddress(req, res, next) {
  try {
    const fields = {
      fullName: readSearch(req.body.fullName),
      phone: readSearch(req.body.phone),
      line1: readSearch(req.body.line1),
      city: readSearch(req.body.city),
      region: readSearch(req.body.region),
      country: readSearch(req.body.country) || "Việt Nam"
    };

    const missing = Object.entries(fields)
      .filter(([key, value]) => key !== "region" && key !== "country" && !value)
      .map(([key]) => key);

    if (missing.length) {
      return sendError(res, {
        statusCode: 400,
        message: "Validation failed",
        errors: Object.fromEntries(missing.map((key) => [key, [`${key} is required.`]]))
      });
    }

    const address = await prisma.$transaction(async (tx) => {
      const count = await tx.address.count({ where: { userId: req.user.id } });
      const isDefault = count === 0 || req.body.isDefault === true;

      if (isDefault) {
        await tx.address.updateMany({ where: { userId: req.user.id }, data: { isDefault: false } });
      }

      return tx.address.create({ data: { ...fields, isDefault, userId: req.user.id } });
    });

    return sendSuccess(res, { statusCode: 201, message: "Address saved", data: { address } });
  } catch (error) {
    return next(error);
  }
}

async function deleteAddress(req, res, next) {
  try {
    const result = await prisma.address.deleteMany({ where: { id: req.params.id, userId: req.user.id } });
    if (result.count === 0) {
      return sendError(res, { statusCode: 404, message: "Address not found", errors: { id: ["Address not found."] } });
    }
    return sendSuccess(res, { message: "Address deleted", data: null });
  } catch (error) {
    return next(error);
  }
}

// ----- checkout -----

// Payment is simulated: "cod" (cash on delivery) leaves the order pending, "card" marks it paid.
const paymentMethods = { cod: "pending", card: "paid" };

async function checkout(req, res, next) {
  try {
    const addressId = String(req.body.addressId || "").trim();
    const paymentMethod = String(req.body.paymentMethod || "cod").trim().toLowerCase();
    const couponCode = readSearch(req.body.couponCode)?.toUpperCase() || null;

    if (!isValidUuid(addressId)) return fail(res, 400, "Choose a delivery address.", { addressId: ["Choose a delivery address."] });
    if (!paymentMethods[paymentMethod]) {
      return fail(res, 400, "Payment method must be cod or card.", { paymentMethod: ["Payment method must be cod or card."] });
    }

    const order = await prisma.$transaction(async (tx) => {
      const address = await tx.address.findFirst({ where: { id: addressId, userId: req.user.id } });
      if (!address) throw httpError(404, "Address not found");

      const cart = await tx.cart.findUnique({ where: { userId: req.user.id }, include: cartInclude });
      if (!cart || cart.items.length === 0) throw httpError(400, "Your cart is empty");

      for (const item of cart.items) {
        if (!item.product.isActive) throw httpError(409, `${item.product.name} is no longer available.`);
        if (item.product.unitsInStock < item.quantity) {
          throw httpError(409, `Only ${item.product.unitsInStock} left for ${item.product.name}.`);
        }
      }

      const subtotal = cart.items.reduce((sum, item) => sum + Number(item.product.price) * item.quantity, 0);

      let coupon = null;
      let discount = 0;
      if (couponCode) {
        coupon = await tx.coupon.findUnique({ where: { code: couponCode } });
        const problem = couponProblem(coupon, subtotal);
        if (problem) throw httpError(400, problem, { couponCode: [problem] });
        discount = couponDiscount(coupon, subtotal);
      }

      const freight = shippingFeeFor(subtotal);
      const total = subtotal - discount + freight;
      const now = new Date();

      // Every customer order is linked to a customer record, created on first purchase.
      const customer = await tx.customer.upsert({
        where: { userId: req.user.id },
        update: { name: address.fullName, phone: address.phone },
        create: {
          userId: req.user.id,
          name: address.fullName,
          phone: address.phone,
          email: req.user.email,
          address: `${address.line1}, ${address.city}`
        }
      });

      const status = paymentMethods[paymentMethod];
      const created = await tx.order.create({
        data: {
          customerId: customer.id,
          createdById: req.user.id,
          placedById: req.user.id,
          status,
          paymentMethod,
          paymentStatus: status === "paid" ? "paid" : "unpaid",
          paidAt: status === "paid" ? now : null,
          couponCode: coupon ? coupon.code : null,
          subtotal,
          discountAmount: discount,
          freight,
          totalAmount: total,
          shipName: address.fullName,
          shipAddress: address.line1,
          shipCity: address.city,
          shipRegion: address.region,
          shipCountry: address.country,
          items: {
            create: cart.items.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              unitPrice: Number(item.product.price),
              discount: 0,
              lineTotal: Number(item.product.price) * item.quantity
            }))
          }
        }
      });

      for (const item of cart.items) {
        await moveStock(tx, {
          productId: item.productId,
          delta: -item.quantity,
          type: "sale",
          userId: req.user.id,
          note: `Web order ${created.id}`
        });
      }

      if (coupon) {
        const claimed = await tx.coupon.updateMany({
          where: {
            id: coupon.id,
            OR: [{ usageLimit: null }, { usedCount: { lt: coupon.usageLimit ?? 0 } }]
          },
          data: { usedCount: { increment: 1 } }
        });
        if (claimed.count !== 1) throw httpError(400, "This coupon has been used up.", { couponCode: ["This coupon has been used up."] });
      }

      await tx.cartItem.deleteMany({ where: { cartId: cart.id } });

      return tx.order.findUnique({ where: { id: created.id }, include: orderInclude });
    }, { timeout: 30000, maxWait: 10000 });

    return sendSuccess(res, { statusCode: 201, message: "Order placed", data: { order: serializeOrder(order) } });
  } catch (error) {
    if (error.status) {
      return sendError(res, {
        statusCode: error.status,
        message: error.message,
        errors: error.errors || { checkout: [error.message] }
      });
    }
    return next(error);
  }
}

function httpError(status, message, errors) {
  const error = new Error(message);
  error.status = status;
  error.errors = errors;
  return error;
}

// ----- customer orders -----

const orderInclude = {
  items: { include: { product: { select: { id: true, name: true, slug: true, imageUrl: true, updatedAt: true } } } }
};

function serializeOrder(order) {
  return {
    id: order.id,
    status: order.status,
    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus,
    couponCode: order.couponCode,
    subtotal: Number(order.subtotal),
    discountAmount: Number(order.discountAmount),
    shipping: Number(order.freight),
    total: Number(order.totalAmount),
    trackingNumber: order.trackingNumber,
    shipName: order.shipName,
    shipAddress: order.shipAddress,
    shipCity: order.shipCity,
    orderDate: order.orderDate,
    paidAt: order.paidAt,
    shippedAt: order.shippedAt,
    deliveredAt: order.deliveredAt,
    cancelledAt: order.cancelledAt,
    items: order.items.map((item) => ({
      productId: item.productId,
      name: item.product?.name,
      slug: item.product?.slug,
      imageUrl: publicImageUrl(item.product),
      quantity: item.quantity,
      unitPrice: Number(item.unitPrice),
      lineTotal: Number(item.lineTotal)
    }))
  };
}

async function listMyOrders(req, res, next) {
  try {
    const { page, pageSize, skip, take } = parsePagination(req.query);
    const where = { placedById: req.user.id };

    const [orders, total] = await prisma.$transaction([
      prisma.order.findMany({ where, skip, take, orderBy: { orderDate: "desc" }, include: orderInclude }),
      prisma.order.count({ where })
    ]);

    return sendSuccess(res, {
      message: "Orders fetched",
      data: { orders: orders.map(serializeOrder), meta: buildMeta({ page, pageSize, total }) }
    });
  } catch (error) {
    return next(error);
  }
}

async function getMyOrder(req, res, next) {
  try {
    const order = await prisma.order.findFirst({
      where: { id: req.params.id, placedById: req.user.id },
      include: orderInclude
    });

    if (!order) {
      return sendError(res, { statusCode: 404, message: "Order not found", errors: { id: ["Order not found."] } });
    }

    return sendSuccess(res, { message: "Order fetched", data: { order: serializeOrder(order) } });
  } catch (error) {
    return next(error);
  }
}

// Customers can cancel only while the order is still pending.
async function cancelMyOrder(req, res, next) {
  try {
    const order = await prisma.$transaction(async (tx) => {
      const current = await tx.order.findFirst({
        where: { id: req.params.id, placedById: req.user.id },
        include: { items: true }
      });
      if (!current) throw httpError(404, "Order not found");
      if (current.status !== "pending") throw httpError(409, "Only pending orders can be cancelled.");

      for (const item of current.items) {
        await moveStock(tx, {
          productId: item.productId,
          delta: item.quantity,
          type: "return",
          userId: req.user.id,
          note: `Customer cancelled order ${current.id}`
        });
      }

      return tx.order.update({
        where: { id: current.id },
        data: { status: "cancelled", cancelledAt: new Date() },
        include: orderInclude
      });
    }, { timeout: 30000, maxWait: 10000 });

    return sendSuccess(res, { message: "Order cancelled", data: { order: serializeOrder(order) } });
  } catch (error) {
    if (error.status) {
      return sendError(res, { statusCode: error.status, message: error.message, errors: { id: [error.message] } });
    }
    return next(error);
  }
}

module.exports = {
  addCartItem,
  cancelMyOrder,
  checkout,
  createAddress,
  deleteAddress,
  getCart,
  getMyOrder,
  listAddresses,
  listMyOrders,
  removeCartItem,
  updateCartItem
};
