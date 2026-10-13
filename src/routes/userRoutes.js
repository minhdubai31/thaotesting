const express = require("express");
const { listUsers, updateUserRoles } = require("../controllers/userController");
const { authenticate } = require("../middleware/authenticate");
const { authorizePermission } = require("../middleware/authorizePermission");
const { validateUuidParam } = require("../middleware/validateUuidParam");

const router = express.Router();

router.get(
  "/users",
  authenticate,
  authorizePermission("users:update_roles"),
  listUsers
);
router.patch(
  "/users/:id/roles",
  authenticate,
  authorizePermission("users:update_roles"),
  validateUuidParam("id"),
  updateUserRoles
);

module.exports = router;
