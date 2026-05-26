const express = require("express");
const { ObjectId } = require("mongodb");
const { z } = require("zod");

const { getDB } = require("../config/db");
const authMiddleware = require("../middleware/authMiddleware");
const { requireRole } = require("../middleware/authorize");

const router = express.Router();

const attachmentSchema = z.object({
  fileName: z.string().min(1, "Attachment must include a file name"),
  mimeType: z.string().regex(/^(image\/(png|jpeg|jpg|gif|webp)|application\/pdf)$/i, "Only images and PDF files are supported"),
  data: z.string().min(1, "Attachment data is required"),
});

const createAssignmentSchema = z.object({
  courseId: z.string().min(1, "Course ID is required"),
  title: z.string().min(5, "Title must be at least 5 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  dueDate: z.string().optional(),
  attachment: attachmentSchema.optional(),
});

function sanitizeAssignment(record, teacherMap = {}) {
  return {
    id: record._id.toString(),
    courseId: record.courseId.toString(),
    title: record.title,
    description: record.description,
    dueDate: record.dueDate,
    createdBy: record.createdBy,
    createdByName: teacherMap[record.createdBy] || null,
    attachment: record.attachment
      ? {
          fileName: record.attachment.fileName,
          mimeType: record.attachment.mimeType,
          data: record.attachment.data,
        }
      : null,
    createdAt: record.createdAt,
  };
}

router.use(authMiddleware);

router.post("/", requireRole("administrator", "teacher"), async (req, res) => {
  try {
    const payload = createAssignmentSchema.parse(req.body);
    const db = getDB();

    const assignment = {
      courseId: payload.courseId,
      title: payload.title,
      description: payload.description,
      dueDate: payload.dueDate ? new Date(payload.dueDate) : null,
      attachment: payload.attachment
        ? {
            fileName: payload.attachment.fileName,
            mimeType: payload.attachment.mimeType,
            data: payload.attachment.data,
          }
        : null,
      createdBy: req.user.id,
      createdAt: new Date(),
    };

    const result = await db.collection("assignments").insertOne(assignment);
    const created = await db.collection("assignments").findOne({ _id: result.insertedId });
    return res.status(201).json({ assignment: sanitizeAssignment(created) });
  } catch (error) {
    console.error("Assignment create error:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: error.errors.map((err) => err.message).join(", ") });
    }
    return res.status(500).json({ message: error.message });
  }
});

router.get("/", async (req, res) => {
  try {
    const db = getDB();
    const assignments = await db.collection("assignments").find().toArray();

    const teacherIds = [...new Set(assignments.map((assignment) => assignment.createdBy).filter(Boolean))].filter(ObjectId.isValid);
    const teacherObjectIds = teacherIds.map((id) => new ObjectId(id));
    const teachers = teacherObjectIds.length
      ? await db.collection("users").find({ _id: { $in: teacherObjectIds } }).toArray()
      : [];

    const teacherMap = Object.fromEntries(teachers.map((user) => [user._id.toString(), user.name]));

    return res.json({ assignments: assignments.map((assignment) => sanitizeAssignment(assignment, teacherMap)) });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const db = getDB();
    const assignment = await db.collection("assignments").findOne({ _id: new ObjectId(req.params.id) });
    if (!assignment) {
      return res.status(404).json({ message: "Assignment not found" });
    }
    return res.json({ assignment: sanitizeAssignment(assignment) });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.put("/:id", requireRole("administrator", "teacher"), async (req, res) => {
  try {
    const payload = createAssignmentSchema.partial().parse(req.body);
    const updates = {
      ...(payload.title ? { title: payload.title } : {}),
      ...(payload.description ? { description: payload.description } : {}),
      ...(payload.dueDate ? { dueDate: new Date(payload.dueDate) } : {}),
    };

    if (payload.courseId) {
      updates.courseId = payload.courseId;
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ message: "No updates provided" });
    }

    const db = getDB();
    await db.collection("assignments").updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: updates },
    );
    const updated = await db.collection("assignments").findOne({ _id: new ObjectId(req.params.id) });
    return res.json({ assignment: sanitizeAssignment(updated) });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: error.errors.map((err) => err.message).join(", ") });
    }
    return res.status(500).json({ message: error.message });
  }
});

router.delete("/:id", requireRole("administrator", "teacher"), async (req, res) => {
  try {
    const db = getDB();
    const result = await db.collection("assignments").deleteOne({ _id: new ObjectId(req.params.id) });
    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "Assignment not found" });
    }
    return res.json({ message: "Assignment deleted" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

module.exports = router;
