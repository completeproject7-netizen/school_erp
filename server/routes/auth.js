const express = require("express");
const asyncHandler = require("../middleware/asyncHandler");
const authMiddleware = require("../middleware/authMiddleware");
const {
  register,
  login,
  refreshToken,
  logout,
  me,
  forgotPassword,
} = require("../controllers/authController");

const router = express.Router();

router.post("/register", asyncHandler(register));
router.post("/login", asyncHandler(login));
router.post("/forgot-password", asyncHandler(forgotPassword));
router.post("/refresh", asyncHandler(refreshToken));
router.post("/logout", asyncHandler(logout));
router.get("/me", authMiddleware, asyncHandler(me));

module.exports = router;
