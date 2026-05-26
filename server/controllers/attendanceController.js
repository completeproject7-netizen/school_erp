const {
  attendanceSchema,
  attendanceUpdateSchema,
} = require("../validators/attendanceValidator");
const {
  attendanceExistsForGradeDate,
  createAttendance,
  deleteAttendance,
  findAttendance,
  findAttendanceById,
  updateAttendance,
} = require("../models/attendanceModel");
const { logAuditEvent } = require("../middleware/auditLogger");

const sanitizeAttendance = (record) => ({
  id: record._id.toString(),
  studentId: record.studentId.toString(),
  courseId: record.courseId ? record.courseId.toString() : null,
  classId: record.classId ? record.classId.toString() : null,
  sectionId: record.sectionId ? record.sectionId.toString() : null,
  grade: record.grade || null,
  date: record.date,
  status: record.status,
  notes: record.notes || "",
  createdBy: record.createdBy,
  createdAt: record.createdAt,
});

const createAttendanceHandler = async (req, res) => {
  const payload = attendanceSchema.parse(req.body);

  if (req.user.role === "teacher" && payload.grade) {
    const exists = await attendanceExistsForGradeDate(payload.grade, payload.date, payload.classId);
    if (exists) {
      return res.status(400).json({
        message: "Attendance has already been submitted for this class on the selected date.",
      });
    }
  }

  const attendance = await createAttendance({
    ...payload,
    createdBy: req.user.id,
  });

  await logAuditEvent({
    action: "create",
    collectionName: "attendance",
    documentId: attendance._id.toString(),
    performedBy: req.user.id,
    userRole: req.user.role,
    details: {
      studentId: payload.studentId,
      grade: payload.grade,
      classId: payload.classId,
      sectionId: payload.sectionId,
      status: payload.status,
    },
  });

  return res.status(201).json({ attendance: sanitizeAttendance(attendance) });
};

const getAttendanceByStudent = async (req, res) => {
  const studentId = req.params.id;
  if (req.user.role === "student" && req.user.id !== studentId) {
    return res.status(403).json({ message: "Access denied" });
  }

  const records = await findAttendance({ studentId });
  return res.json({ attendance: records.map(sanitizeAttendance) });
};

const listAttendance = async (req, res) => {
  const { grade, courseId, studentId, date } = req.query;
  const records = await findAttendance({ grade, courseId, studentId, date });
  return res.json({ attendance: records.map(sanitizeAttendance) });
};

const getAttendanceByCourse = async (req, res) => {
  const courseId = req.params.id;
  const records = await findAttendance({ courseId });
  return res.json({ attendance: records.map(sanitizeAttendance) });
};

const getMyAttendance = async (req, res) => {
  if (req.user.role !== "student") {
    return res.status(403).json({ message: "Only students may view their own attendance" });
  }

  const records = await findAttendance({ studentId: req.user.id });
  return res.json({ attendance: records.map(sanitizeAttendance) });
};

const updateAttendanceHandler = async (req, res) => {
  const payload = attendanceUpdateSchema.parse(req.body);
  const attendance = await updateAttendance(req.params.id, payload);

  if (!attendance) {
    return res.status(404).json({ message: "Attendance record not found or no updates provided" });
  }

  await logAuditEvent({
    action: "update",
    collectionName: "attendance",
    documentId: attendance._id.toString(),
    performedBy: req.user.id,
    userRole: req.user.role,
    details: { updatedFields: Object.keys(payload) },
  });

  return res.json({ attendance: sanitizeAttendance(attendance) });
};

const deleteAttendanceHandler = async (req, res) => {
  const removed = await deleteAttendance(req.params.id);
  if (!removed) {
    return res.status(404).json({ message: "Attendance record not found" });
  }

  await logAuditEvent({
    action: "delete",
    collectionName: "attendance",
    documentId: req.params.id,
    performedBy: req.user.id,
    userRole: req.user.role,
  });

  return res.json({ message: "Attendance record deleted" });
};

module.exports = {
  createAttendanceHandler,
  getAttendanceByStudent,
  listAttendance,
  getAttendanceByCourse,
  getMyAttendance,
  updateAttendanceHandler,
  deleteAttendanceHandler,
};
