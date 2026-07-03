const express = require("express");
const { login, signup } = require("../controllers/authController");
const { authenticate } = require("../middleware/authenticate");
const { authorize } = require("../middleware/authorize");
const { sendSuccess } = require("../utils/response");

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);

router.get("/me", authenticate, (req, res) => {
  sendSuccess(res, {
    message: "Authenticated user fetched",
    data: { user: req.user }
  });
});

router.get("/user-area", authenticate, authorize(), (req, res) => {
  sendSuccess(res, {
    message: "Authenticated users can access this route.",
    data: null
  });
});

router.get("/admin-area", authenticate, authorize("admin"), (req, res) => {
  sendSuccess(res, {
    message: "Admins can access this route.",
    data: null
  });
});

router.get(
  "/manager-area",
  authenticate,
  authorize("admin", "manager"),
  (req, res) => {
    sendSuccess(res, {
      message: "Admins and managers can access this route.",
      data: null
    });
  }
);

module.exports = router;
