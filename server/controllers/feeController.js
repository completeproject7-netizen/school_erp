const { payFeeSchema, updateFeeSchema } = require("../validators/feeValidator");
const { logAuditEvent } = require("../middleware/auditLogger");
const {
  payFee,
  findFees,
  findFeeById,
  updateFee,
  deleteFee,
} = require("../models/feeModel");
const { resolveStudentObjectId } = require("../models/userModel");

const payFeeHandler = async (req, res) => {
  const payload = payFeeSchema.parse(req.body);
  const studentIdentifier = payload.studentId || req.user.id;

  if (req.user.role === "student" && studentIdentifier !== req.user.id) {
    return res.status(403).json({ message: "Students can only pay their own fees" });
  }

  if (req.user.role !== "student" && !payload.studentId) {
    return res.status(400).json({ message: "studentId is required for staff payments" });
  }

  const studentObjectId = await resolveStudentObjectId(studentIdentifier);
  if (!studentObjectId) {
    return res.status(404).json({ message: "Student not found" });
  }

  const payment = await payFee({
    ...payload,
    studentId: studentObjectId.toString(),
    createdBy: req.user.id,
    createdByName: req.user.name || req.user.email,
  });

  await logAuditEvent({
    action: "create",
    collectionName: "fees",
    documentId: payment._id.toString(),
    performedBy: req.user.id,
    userRole: req.user.role,
    details: { studentId: payment.studentId.toString(), amount: payment.amount },
  });

  return res.status(201).json({ payment });
};

const getStudentFees = async (req, res) => {
  const studentIdentifier = req.params.id;
  if (req.user.role === "student" && req.user.id !== studentIdentifier) {
    return res.status(403).json({ message: "Access denied" });
  }

  const studentObjectId = await resolveStudentObjectId(studentIdentifier);
  if (!studentObjectId) {
    return res.status(404).json({ message: "Student not found" });
  }

  const records = await findFees({ studentId: studentObjectId.toString() });
  return res.json({ fees: records });
};

const listFeesHandler = async (req, res) => {
  const records = await findFees();
  return res.json({ fees: records });
};

const getMyFees = async (req, res) => {
  if (req.user.role !== "student") {
    return res.status(403).json({ message: "Only students may view their own fees" });
  }

  const records = await findFees({ studentId: req.user.id });
  return res.json({ fees: records });
};

const updateFeeHandler = async (req, res) => {
  const payload = updateFeeSchema.parse(req.body);
  const fee = await updateFee(req.params.id, payload);

  if (!fee) {
    return res.status(404).json({ message: "Fee record not found or no updates provided" });
  }

  await logAuditEvent({
    action: "update",
    collectionName: "fees",
    documentId: fee._id.toString(),
    performedBy: req.user.id,
    userRole: req.user.role,
    details: { updatedFields: Object.keys(payload) },
  });

  return res.json({ fee });
};

const deleteFeeHandler = async (req, res) => {
  const removed = await deleteFee(req.params.id);
  if (!removed) {
    return res.status(404).json({ message: "Fee record not found" });
  }

  await logAuditEvent({
    action: "delete",
    collectionName: "fees",
    documentId: req.params.id,
    performedBy: req.user.id,
    userRole: req.user.role,
  });

  return res.json({ message: "Fee record deleted" });
};

module.exports = {
  payFeeHandler,
  getStudentFees,
  listFeesHandler,
  getMyFees,
  updateFeeHandler,
  deleteFeeHandler,
};
