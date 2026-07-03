const { prisma } = require("../config/prisma");

const allowedStatuses = ["pending", "completed", "cancelled"];

function parseNonNegativeMoney(value, fallback = 0) {
  if (value === undefined) {
    return fallback;
  }

  const amount = Number(value);
  return Number.isFinite(amount) && amount >= 0 ? amount : null;
}

function parseDiscount(value) {
  if (value === undefined) {
    return 0;
  }

  const discount = Number(value);
  return Number.isFinite(discount) && discount >= 0 && discount <= 1
    ? discount
    : null;
}

function parseOptionalDate(value) {
  if (value === undefined) {
    return undefined;
  }

  if (value === null || value === "") {
    return null;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function readOptionalString(value) {
  if (value === undefined) {
    return undefined;
  }

  const normalized = String(value || "").trim();
  return normalized || null;
}

function parseOrderItems(items) {
  if (!Array.isArray(items) || items.length === 0) {
    return null;
  }

  const itemMap = new Map();

  for (const item of items) {
    const productId = String(item.productId || "").trim();
    const quantity = Number(item.quantity);
    const unitPrice = item.unitPrice === undefined ? undefined : parseNonNegativeMoney(item.unitPrice);
    const discount = parseDiscount(item.discount);

    if (
      !productId ||
      !Number.isInteger(quantity) ||
      quantity <= 0 ||
      unitPrice === null ||
      discount === null
    ) {
      return null;
    }

    const key = `${productId}:${unitPrice ?? "product"}:${discount}`;
    const existingItem = itemMap.get(key);
    itemMap.set(key, {
      productId,
      quantity: (existingItem ? existingItem.quantity : 0) + quantity,
      unitPrice,
      discount
    });
  }

  return [...itemMap.values()];
}

function serializeOrder(order) {
  return {
    ...order,
    freight: order.freight.toString(),
    totalAmount: order.totalAmount.toString(),
    items: order.items.map((item) => ({
      ...item,
      unitPrice: item.unitPrice.toString(),
      discount: item.discount.toString(),
      lineTotal: item.lineTotal.toString()
    }))
  };
}

const orderInclude = {
  customer: true,
  employee: true,
  deliveryCompany: true,
  createdBy: {
    select: { id: true, email: true, roles: true }
  },
  items: {
    include: {
      product: {
        include: {
          categoryRef: true,
          supplier: true
        }
      }
    }
  }
};

async function listOrders(req, res, next) {
  try {
    const orders = await prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      include: orderInclude
    });

    return res.json({ orders: orders.map(serializeOrder) });
  } catch (error) {
    return next(error);
  }
}

async function createOrder(req, res, next) {
  try {
    const customerId =
      req.body.customerId === undefined
        ? null
        : String(req.body.customerId || "").trim() || null;
    const employeeId =
      req.body.employeeId === undefined
        ? null
        : String(req.body.employeeId || "").trim() || null;
    const deliveryCompanyId =
      req.body.deliveryCompanyId === undefined
        ? null
        : String(req.body.deliveryCompanyId || "").trim() || null;
    const requiredDate = parseOptionalDate(req.body.requiredDate);
    const shippedDate = parseOptionalDate(req.body.shippedDate);
    const freight = parseNonNegativeMoney(req.body.freight, 0);
    const items = parseOrderItems(req.body.items);

    if (!items || requiredDate === null || shippedDate === null || freight === null) {
      return res.status(400).json({
        message:
          "Items, valid dates, non-negative freight, productId, quantity, unitPrice, and discount are required"
      });
    }

    const order = await prisma.$transaction(async (tx) => {
      if (customerId) {
        const customer = await tx.customer.findUnique({
          where: { id: customerId },
          select: { id: true }
        });

        if (!customer) {
          const error = new Error("Customer not found");
          error.status = 404;
          throw error;
        }
      }

      if (employeeId) {
        const employee = await tx.employee.findUnique({
          where: { id: employeeId },
          select: { id: true }
        });

        if (!employee) {
          const error = new Error("Employee not found");
          error.status = 404;
          throw error;
        }
      }

      if (deliveryCompanyId) {
        const deliveryCompany = await tx.deliveryCompany.findUnique({
          where: { id: deliveryCompanyId },
          select: { id: true }
        });

        if (!deliveryCompany) {
          const error = new Error("Delivery company not found");
          error.status = 404;
          throw error;
        }
      }

      const products = await tx.product.findMany({
        where: { id: { in: items.map((item) => item.productId) } },
        include: { inventory: true }
      });
      const productMap = new Map(products.map((product) => [product.id, product]));

      for (const item of items) {
        const product = productMap.get(item.productId);

        if (!product || !product.isActive) {
          const error = new Error("Product not found or inactive");
          error.status = 404;
          throw error;
        }

        const availableQuantity = product.inventory ? product.inventory.quantity : 0;

        if (availableQuantity < item.quantity) {
          const error = new Error(`Insufficient stock for ${product.sku}`);
          error.status = 409;
          throw error;
        }
      }

      const orderItems = items.map((item) => {
        const product = productMap.get(item.productId);
        const unitPrice = item.unitPrice ?? Number(product.price);
        const lineTotal = unitPrice * item.quantity * (1 - item.discount);

        return {
          productId: item.productId,
          quantity: item.quantity,
          unitPrice,
          discount: item.discount,
          lineTotal
        };
      });
      const totalAmount = orderItems.reduce(
        (sum, item) => sum + item.lineTotal,
        freight
      );

      const createdOrder = await tx.order.create({
        data: {
          customerId,
          employeeId,
          deliveryCompanyId,
          createdById: req.user.id,
          status: "completed",
          requiredDate,
          shippedDate,
          freight,
          shipName: readOptionalString(req.body.shipName),
          shipAddress: readOptionalString(req.body.shipAddress),
          shipCity: readOptionalString(req.body.shipCity),
          shipRegion: readOptionalString(req.body.shipRegion),
          shipPostalCode: readOptionalString(req.body.shipPostalCode),
          shipCountry: readOptionalString(req.body.shipCountry),
          totalAmount,
          items: {
            create: orderItems
          }
        },
        include: orderInclude
      });

      for (const item of items) {
        const updatedInventory = await tx.inventoryItem.updateMany({
          where: {
            productId: item.productId,
            quantity: { gte: item.quantity }
          },
          data: {
            quantity: { decrement: item.quantity }
          }
        });

        if (updatedInventory.count !== 1) {
          const error = new Error("Insufficient stock");
          error.status = 409;
          throw error;
        }

        const product = productMap.get(item.productId);
        await tx.product.update({
          where: { id: item.productId },
          data: {
            unitsInStock: (product.inventory ? product.inventory.quantity : 0) - item.quantity
          }
        });

        await tx.stockMovement.create({
          data: {
            productId: item.productId,
            userId: req.user.id,
            type: "sale",
            quantity: -item.quantity,
            note: `Order ${createdOrder.id}`
          }
        });
      }

      return createdOrder;
    });

    return res.status(201).json({ order: serializeOrder(order) });
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({ message: error.message });
    }

    return next(error);
  }
}

async function updateOrderStatus(req, res, next) {
  try {
    const status = String(req.body.status || "").trim().toLowerCase();

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        message: `Status must be one of: ${allowedStatuses.join(", ")}`
      });
    }

    const order = await prisma.order.update({
      where: { id: req.params.id },
      data: { status },
      include: orderInclude
    });

    return res.json({ order: serializeOrder(order) });
  } catch (error) {
    if (error.code === "P2025") {
      return res.status(404).json({ message: "Order not found" });
    }

    return next(error);
  }
}

module.exports = {
  listOrders,
  createOrder,
  updateOrderStatus
};
