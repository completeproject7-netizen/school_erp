const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const asyncHandler = require("../middleware/asyncHandler");
const {
  payFeeHandler,
  getStudentFees,
  listFeesHandler,
  getMyFees,
  updateFeeHandler,
  deleteFeeHandler,
} = require("../controllers/feeController");
const { requireRole } = require("../middleware/authorize");

const router = express.Router();
router.use(authMiddleware);

router.post("/pay", asyncHandler(payFeeHandler));
router.get("/student/:id", asyncHandler(getStudentFees));
router.get("/", requireRole("administrator", "teacher"), asyncHandler(listFeesHandler));
router.get("/mine", asyncHandler(getMyFees));
router.put("/:id", requireRole("administrator", "teacher"), asyncHandler(updateFeeHandler));
router.delete("/:id", requireRole("administrator", "teacher"), asyncHandler(deleteFeeHandler));

module.exports = router;
