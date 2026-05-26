const bcrypt = require("bcryptjs");
const {
  createStudentSchema,
  updateStudentSchema,
} = require("../validators/studentValidator");
const {
  createStudent,
  deleteStudent,
  findStudentByEmail,
  findStudentById,
  findStudents,
  toPublicUser,
  updateStudent,
} = require("../models/userModel");
const { logAuditEvent } = require("../middleware/auditLogger");

const listStudents = async (req, res) => {
  const students = await findStudents();
  return res.json({ students: students.map(toPublicUser) });
};

const getStudent = async (req, res) => {
  const { id } = req.params;
  if (req.user.role === "student" && req.user.id !== id) {
    return res.status(403).json({ message: "Access denied" });
  }

  const student = await findStudentById(id);
  if (!student) {
    return res.status(404).json({ message: "Student not found" });
  }

  return res.json({ student: toPublicUser(student) });
};

const createStudentHandler = async (req, res) => {
  const payload = createStudentSchema.parse(req.body);
  const existing = await findStudentByEmail(payload.email);
  if (existing) {
    return res.status(400).json({ message: "Email already exists" });
  }

  const hashedPassword = await bcrypt.hash(payload.password, 10);
  const student = await createStudent({ ...payload, password: hashedPassword });

  await logAuditEvent({
    action: "create",
    collectionName: "users",
    documentId: student._id.toString(),
    performedBy: req.user.id,
    userRole: req.user.role,
    details: { role: student.role, studentId: student.studentId },
  });

  return res.status(201).json({ student: toPublicUser(student) });
};

const updateStudentHandler = async (req, res) => {
  const payload = updateStudentSchema.parse(req.body);

  if (req.user.role === "teacher" && payload.password) {
    return res.status(403).json({ message: "Teachers cannot change student passwords" });
  }

  if (payload.password) {
    payload.password = await bcrypt.hash(payload.password, 10);
  }

  const student = await updateStudent(req.params.id, payload);
  if (!student) {
    return res.status(404).json({ message: "Student not found or no updates provided" });
  }

  await logAuditEvent({
    action: "update",
    collectionName: "users",
    documentId: student._id.toString(),
    performedBy: req.user.id,
    userRole: req.user.role,
    details: { updatedFields: Object.keys(payload) },
  });

  return res.json({ student: toPublicUser(student) });
};

const deleteStudentHandler = async (req, res) => {
  const removed = await deleteStudent(req.params.id);
  if (!removed) {
    return res.status(404).json({ message: "Student not found" });
  }

  await logAuditEvent({
    action: "delete",
    collectionName: "users",
    documentId: req.params.id,
    performedBy: req.user.id,
    userRole: req.user.role,
  });

  return res.json({ message: "Student deleted" });
};

module.exports = {
  listStudents,
  getStudent,
  createStudentHandler,
  updateStudentHandler,
  deleteStudentHandler,
};
