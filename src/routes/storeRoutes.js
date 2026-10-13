const express = require("express");
const {
  createReview,
  getStoreProduct,
  listStoreBrands,
  listStoreCategories,
  listStoreProducts
} = require("../controllers/storeController");
const { authenticate } = require("../middleware/authenticate");

const router = express.Router();

// Public storefront catalog.
router.get("/store/products", listStoreProducts);
router.get("/store/products/:slug", getStoreProduct);
router.post("/store/products/:slug/reviews", authenticate, createReview);
router.get("/store/categories", listStoreCategories);
router.get("/store/brands", listStoreBrands);

module.exports = router;
