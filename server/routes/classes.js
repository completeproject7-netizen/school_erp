const express = require("express");
const asyncHandler = require("../middleware/asyncHandler");
const authMiddleware = require("../middleware/authMiddleware");
const { requireRole } = require("../middleware/authorize");
const {
  listClasses,
  getClass,
  createClassHandler,
  updateClassHandler,
  deleteClassHandler,
} = require("../controllers/classController");

const router = express.Router();
router.use(authMiddleware);

router.get("/", asyncHandler(listClasses));
router.get("/:id", asyncHandler(getClass));
router.post("/", requireRole("administrator", "teacher"), asyncHandler(createClassHandler));
router.put("/:id", requireRole("administrator", "teacher"), asyncHandler(updateClassHandler));
router.delete("/:id", requireRole("administrator"), asyncHandler(deleteClassHandler));

module.exports = router;
