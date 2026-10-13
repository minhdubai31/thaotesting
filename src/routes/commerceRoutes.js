const express = require("express");
const {
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
} = require("../controllers/commerceController");
const { authenticate } = require("../middleware/authenticate");

const router = express.Router();

// Everything here belongs to the signed-in customer. Authenticate per route so
// this router does not guard other /api paths it is mounted beside.

router.get("/cart", authenticate, getCart);
router.post("/cart/items", authenticate, addCartItem);
router.patch("/cart/items/:productId", authenticate, updateCartItem);
router.delete("/cart/items/:productId", authenticate, removeCartItem);

router.get("/addresses", authenticate, listAddresses);
router.post("/addresses", authenticate, createAddress);
router.delete("/addresses/:id", authenticate, deleteAddress);

router.post("/checkout", authenticate, checkout);

router.get("/my/orders", authenticate, listMyOrders);
router.get("/my/orders/:id", authenticate, getMyOrder);
router.post("/my/orders/:id/cancel", authenticate, cancelMyOrder);

module.exports = router;
