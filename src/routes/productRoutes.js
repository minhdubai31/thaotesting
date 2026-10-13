const express = require("express");
const {
  createProduct,
  getProduct,
  deleteProduct,
  listProducts,
  updateProduct
} = require("../controllers/productController");
const { authenticate } = require("../middleware/authenticate");
const { authorizePermission } = require("../middleware/authorizePermission");
const { validateUuidParam } = require("../middleware/validateUuidParam");

const router = express.Router();

router.get(
  "/products",
  authenticate,
  authorizePermission("products:read"),
  listProducts
);
router.get(
  "/products/:id",
  authenticate,
  authorizePermission("products:read"),
  validateUuidParam("id"),
  getProduct
);
router.post(
  "/products",
  authenticate,
  authorizePermission("products:create"),
  createProduct
);
router.patch(
  "/products/:id",
  authenticate,
  authorizePermission("products:update"),
  validateUuidParam("id"),
  updateProduct
);
router.delete(
  "/products/:id",
  authenticate,
  authorizePermission("products:delete"),
  validateUuidParam("id"),
  deleteProduct
);

module.exports = router;
