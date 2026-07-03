const express = require("express");
const {
  adjustInventory,
  listInventory
} = require("../controllers/inventoryController");
const { authenticate } = require("../middleware/authenticate");
const { authorizePermission } = require("../middleware/authorizePermission");

const router = express.Router();

router.get(
  "/inventory",
  authenticate,
  authorizePermission("inventory:read"),
  listInventory
);
router.post(
  "/inventory/adjustments",
  authenticate,
  authorizePermission("inventory:adjust"),
  adjustInventory
);

module.exports = router;
