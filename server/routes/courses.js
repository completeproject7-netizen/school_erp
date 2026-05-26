const express = require("express");
const asyncHandler = require("../middleware/asyncHandler");
const authMiddleware = require("../middleware/authMiddleware");
const { requireRole } = require("../middleware/authorize");
const {
  listCourses,
  getCourse,
  createCourseHandler,
  updateCourseHandler,
  deleteCourseHandler,
} = require("../controllers/courseController");

const router = express.Router();
router.use(authMiddleware);

router.get("/", asyncHandler(listCourses));
router.post("/", requireRole("administrator", "teacher"), asyncHandler(createCourseHandler));
router.get("/:id", asyncHandler(getCourse));
router.put("/:id", requireRole("administrator", "teacher"), asyncHandler(updateCourseHandler));
router.delete("/:id", requireRole("administrator"), asyncHandler(deleteCourseHandler));

module.exports = router;
