const express = require("express");
const asyncHandler = require("../middleware/asyncHandler");
const authMiddleware = require("../middleware/authMiddleware");
const { requireRole } = require("../middleware/authorize");
const { listAuditLogs } = require("../controllers/auditController");

const router = express.Router();
router.use(authMiddleware);

router.get("/", requireRole("administrator"), asyncHandler(listAuditLogs));

module.exports = router;
