// Shared rules for the storefront: pricing, coupons, stock movements and order status flow.

const SHIPPING_FEE = 30000;
const FREE_SHIPPING_THRESHOLD = 500000;

// Allowed order status changes. "completed" means delivered.
const orderTransitions = {
  pending: ["paid", "cancelled"],
  paid: ["shipped", "cancelled", "refunded"],
  shipped: ["completed", "refunded"],
  completed: ["refunded"],
  cancelled: [],
  refunded: []
};

// Orders in these states have returned their stock to inventory.
const restockStatuses = ["cancelled", "refunded"];

function slugify(text) {
  return String(text || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function shippingFeeFor(subtotal) {
  return subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
}

// Returns an error message when the coupon cannot be used, or null when it is valid.
function couponProblem(coupon, subtotal, now = new Date()) {
  if (!coupon || !coupon.active) return "This coupon is not valid.";
  if (coupon.startsAt && now < coupon.startsAt) return "This coupon is not active yet.";
  if (coupon.endsAt && now > coupon.endsAt) return "This coupon has expired.";
  if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
    return "This coupon has been used up.";
  }
  if (subtotal < Number(coupon.minSubtotal)) {
    return `Minimum order for this coupon is ${Number(coupon.minSubtotal).toLocaleString("vi-VN")} VND.`;
  }
  return null;
}

function couponDiscount(coupon, subtotal) {
  const value = Number(coupon.value);
  const discount = coupon.type === "percent" ? Math.round((subtotal * value) / 100) : value;
  return Math.min(discount, subtotal);
}

// Changes stock on hand and records a movement. Use inside a Prisma transaction (tx).
async function moveStock(tx, { productId, delta, type, userId, note }) {
  const inventory = await tx.inventoryItem.findUnique({ where: { productId } });
  const current = inventory ? inventory.quantity : 0;
  const next = current + delta;

  if (next < 0) {
    const error = new Error("Insufficient stock");
    error.status = 409;
    throw error;
  }

  await tx.inventoryItem.upsert({
    where: { productId },
    update: { quantity: next },
    create: { productId, quantity: next }
  });
  await tx.product.update({ where: { id: productId }, data: { unitsInStock: next } });
  await tx.stockMovement.create({
    data: { productId, userId, type, quantity: delta, note }
  });
}

module.exports = {
  SHIPPING_FEE,
  FREE_SHIPPING_THRESHOLD,
  orderTransitions,
  restockStatuses,
  slugify,
  shippingFeeFor,
  couponProblem,
  couponDiscount,
  moveStock
};
