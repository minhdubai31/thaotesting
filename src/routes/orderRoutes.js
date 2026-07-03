const express = require("express");
const {
  createOrder,
  listOrders,
  updateOrderStatus
} = require("../controllers/orderController");
const { authenticate } = require("../middleware/authenticate");
const { authorizePermission } = require("../middleware/authorizePermission");

const router = express.Router();

router.get(
  "/orders",
  authenticate,
  authorizePermission("orders:read"),
  listOrders
);
router.post(
  "/orders",
  authenticate,
  authorizePermission("orders:create"),
  createOrder
);
router.patch(
  "/orders/:id/status",
  authenticate,
  authorizePermission("orders:update"),
  updateOrderStatus
);

module.exports = router;
