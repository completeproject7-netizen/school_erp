const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const asyncHandler = require("../middleware/asyncHandler");
const {
  listStudents,
  getStudent,
  createStudentHandler,
  updateStudentHandler,
  deleteStudentHandler,
} = require("../controllers/studentController");
const { requireRole } = require("../middleware/authorize");

const router = express.Router();
router.use(authMiddleware);

router.get("/", requireRole("administrator", "teacher"), asyncHandler(listStudents));
router.get("/:id", asyncHandler(getStudent));
router.post("/", requireRole("administrator"), asyncHandler(createStudentHandler));
router.put("/:id", requireRole("administrator", "teacher"), asyncHandler(updateStudentHandler));
router.delete("/:id", requireRole("administrator"), asyncHandler(deleteStudentHandler));

module.exports = router;
