const express = require("express");
const {
  createCategory,
  createDeliveryCompany,
  createEmployee,
  createSupplier,
  listCategories,
  listDeliveryCompanies,
  listEmployees,
  listSuppliers,
  updateCategory,
  updateDeliveryCompany,
  updateEmployee,
  updateSupplier
} = require("../controllers/masterDataController");
const { authenticate } = require("../middleware/authenticate");
const { authorizePermission } = require("../middleware/authorizePermission");
const { validateUuidParam } = require("../middleware/validateUuidParam");

const router = express.Router();

router.get(
  "/categories",
  authenticate,
  authorizePermission("categories:read"),
  listCategories
);
router.post(
  "/categories",
  authenticate,
  authorizePermission("categories:create"),
  createCategory
);
router.patch(
  "/categories/:id",
  authenticate,
  authorizePermission("categories:update"),
  validateUuidParam("id"),
  updateCategory
);

router.get(
  "/suppliers",
  authenticate,
  authorizePermission("suppliers:read"),
  listSuppliers
);
router.post(
  "/suppliers",
  authenticate,
  authorizePermission("suppliers:create"),
  createSupplier
);
router.patch(
  "/suppliers/:id",
  authenticate,
  authorizePermission("suppliers:update"),
  validateUuidParam("id"),
  updateSupplier
);

router.get(
  "/delivery-companies",
  authenticate,
  authorizePermission("delivery_companies:read"),
  listDeliveryCompanies
);
router.post(
  "/delivery-companies",
  authenticate,
  authorizePermission("delivery_companies:create"),
  createDeliveryCompany
);
router.patch(
  "/delivery-companies/:id",
  authenticate,
  authorizePermission("delivery_companies:update"),
  validateUuidParam("id"),
  updateDeliveryCompany
);

router.get(
  "/employees",
  authenticate,
  authorizePermission("employees:read"),
  listEmployees
);
router.post(
  "/employees",
  authenticate,
  authorizePermission("employees:create"),
  createEmployee
);
router.patch(
  "/employees/:id",
  authenticate,
  authorizePermission("employees:update"),
  validateUuidParam("id"),
  updateEmployee
);

module.exports = router;
