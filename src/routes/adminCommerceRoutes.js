const express = require("express");
const {
  createCoupon,
  getAnalyticsSummary,
  listCoupons,
  updateCoupon
} = require("../controllers/adminCommerceController");
const { authenticate } = require("../middleware/authenticate");
const { authorizePermission } = require("../middleware/authorizePermission");
const { validateUuidParam } = require("../middleware/validateUuidParam");

const router = express.Router();

router.get("/coupons", authenticate, authorizePermission("coupons:read"), listCoupons);
router.post("/coupons", authenticate, authorizePermission("coupons:manage"), createCoupon);
router.patch("/coupons/:id", authenticate, authorizePermission("coupons:manage"), validateUuidParam("id"), updateCoupon);
router.get("/analytics/summary", authenticate, authorizePermission("analytics:read"), getAnalyticsSummary);

module.exports = router;
