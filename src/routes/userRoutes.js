const express = require("express");
const { updateUserRoles } = require("../controllers/userController");
const { authenticate } = require("../middleware/authenticate");
const { authorizePermission } = require("../middleware/authorizePermission");
const { validateUuidParam } = require("../middleware/validateUuidParam");

const router = express.Router();

router.patch(
  "/users/:id/roles",
  authenticate,
  authorizePermission("users:update_roles"),
  validateUuidParam("id"),
  updateUserRoles
);

module.exports = router;
