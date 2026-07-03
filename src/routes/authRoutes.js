const express = require("express");
const { login, signup } = require("../controllers/authController");
const { authenticate } = require("../middleware/authenticate");
const { authorize } = require("../middleware/authorize");

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);

router.get("/me", authenticate, (req, res) => {
  res.json({
    user: req.user
  });
});

router.get("/user-area", authenticate, authorize(), (req, res) => {
  res.json({
    message: "Authenticated users can access this route."
  });
});

router.get("/admin-area", authenticate, authorize("admin"), (req, res) => {
  res.json({
    message: "Admins can access this route."
  });
});

router.get(
  "/manager-area",
  authenticate,
  authorize("admin", "manager"),
  (req, res) => {
    res.json({
      message: "Admins and managers can access this route."
    });
  }
);

module.exports = router;
