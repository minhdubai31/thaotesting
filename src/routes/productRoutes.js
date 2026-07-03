const express = require("express");
const {
  createProduct,
  deleteProduct,
  listProducts,
  updateProduct
} = require("../controllers/productController");
const { authenticate } = require("../middleware/authenticate");
const { authorizePermission } = require("../middleware/authorizePermission");

const router = express.Router();

router.get(
  "/products",
  authenticate,
  authorizePermission("products:read"),
  listProducts
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
  updateProduct
);
router.delete(
  "/products/:id",
  authenticate,
  authorizePermission("products:delete"),
  deleteProduct
);

module.exports = router;
