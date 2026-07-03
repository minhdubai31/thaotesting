const express = require("express");
const {
  createCustomer,
  listCustomers,
  updateCustomer
} = require("../controllers/customerController");
const { authenticate } = require("../middleware/authenticate");
const { authorizePermission } = require("../middleware/authorizePermission");

const router = express.Router();

router.get(
  "/customers",
  authenticate,
  authorizePermission("customers:read"),
  listCustomers
);
router.post(
  "/customers",
  authenticate,
  authorizePermission("customers:create"),
  createCustomer
);
router.patch(
  "/customers/:id",
  authenticate,
  authorizePermission("customers:update"),
  updateCustomer
);

module.exports = router;
