const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const asyncHandler = require("../middleware/asyncHandler");
const {
  createAttendanceHandler,
  getAttendanceByStudent,
  listAttendance,
  getAttendanceByCourse,
  getMyAttendance,
  updateAttendanceHandler,
  deleteAttendanceHandler,
} = require("../controllers/attendanceController");
const { requireRole } = require("../middleware/authorize");

const router = express.Router();
router.use(authMiddleware);

router.post("/", requireRole("administrator", "teacher"), asyncHandler(createAttendanceHandler));
router.get("/student/:id", asyncHandler(getAttendanceByStudent));
router.get("/", requireRole("administrator", "teacher"), asyncHandler(listAttendance));
router.get("/course/:id", requireRole("administrator", "teacher"), asyncHandler(getAttendanceByCourse));
router.get("/mine", asyncHandler(getMyAttendance));
router.put("/:id", requireRole("administrator", "teacher"), asyncHandler(updateAttendanceHandler));
router.delete("/:id", requireRole("administrator", "teacher"), asyncHandler(deleteAttendanceHandler));

module.exports = router;
