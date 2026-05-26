const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const asyncHandler = require("../middleware/asyncHandler");
const { requireRole } = require("../middleware/authorize");
const {
  dashboard,
  attendanceSummary,
  feeSummary,
} = require("../controllers/analyticsController");

const router = express.Router();
router.use(authMiddleware);

router.get("/dashboard", requireRole("administrator", "teacher"), asyncHandler(dashboard));
router.get("/attendance-summary", requireRole("administrator", "teacher"), asyncHandler(attendanceSummary));
router.get("/fee-summary", requireRole("administrator", "teacher"), asyncHandler(feeSummary));

module.exports = router;
