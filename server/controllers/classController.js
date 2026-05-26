const { classSchema, updateClassSchema } = require("../validators/classValidator");
const { createClass, deleteClass, findClassById, findClasses, sanitizeClass, updateClass } = require("../models/classModel");
const { logAuditEvent } = require("../middleware/auditLogger");

const listClasses = async (req, res) => {
  const { name, section, teacherId } = req.query;
  const classes = await findClasses({ name, section, teacherId });
  return res.json({ classes: classes.map(sanitizeClass) });
};

const getClass = async (req, res) => {
  const klass = await findClassById(req.params.id);
  if (!klass) {
    return res.status(404).json({ message: "Class not found" });
  }
  return res.json({ klass: sanitizeClass(klass) });
};

const createClassHandler = async (req, res) => {
  const payload = classSchema.parse(req.body);
  const klass = await createClass(payload);

  await logAuditEvent({
    action: "create",
    collectionName: "classes",
    documentId: klass._id.toString(),
    performedBy: req.user.id,
    userRole: req.user.role,
    details: { name: klass.name, section: klass.section },
  });

  return res.status(201).json({ klass: sanitizeClass(klass) });
};

const updateClassHandler = async (req, res) => {
  const payload = updateClassSchema.parse(req.body);
  const klass = await updateClass(req.params.id, payload);
  if (!klass) {
    return res.status(404).json({ message: "Class not found or no updates provided" });
  }

  await logAuditEvent({
    action: "update",
    collectionName: "classes",
    documentId: klass._id.toString(),
    performedBy: req.user.id,
    userRole: req.user.role,
    details: { updatedFields: Object.keys(payload) },
  });

  return res.json({ klass: sanitizeClass(klass) });
};

const deleteClassHandler = async (req, res) => {
  const removed = await deleteClass(req.params.id);
  if (!removed) {
    return res.status(404).json({ message: "Class not found" });
  }

  await logAuditEvent({
    action: "delete",
    collectionName: "classes",
    documentId: req.params.id,
    performedBy: req.user.id,
    userRole: req.user.role,
  });

  return res.json({ message: "Class deleted" });
};

module.exports = {
  listClasses,
  getClass,
  createClassHandler,
  updateClassHandler,
  deleteClassHandler,
};
