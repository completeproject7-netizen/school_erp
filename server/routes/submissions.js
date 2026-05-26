const express = require("express");
const { ObjectId } = require("mongodb");
const { z } = require("zod");

const { getDB } = require("../config/db");
const authMiddleware = require("../middleware/authMiddleware");
const { requireRole } = require("../middleware/authorize");

const router = express.Router();

const attachmentSchema = z.object({
  fileName: z.string().min(1, "Attachment must include a file name"),
  mimeType: z.string().regex(/^(application\/pdf|image\/[a-zA-Z0-9.+-]+)$/i, "Only PDF or image attachments are supported"),
  data: z.string().min(1, "Attachment data is required"),
});

const submissionSchema = z
  .object({
    assignmentId: z.string().min(1, "Assignment ID is required"),
    content: z.string().optional(),
    attachment: attachmentSchema.optional(),
  })
  .refine((data) => (data.content?.trim().length ?? 0) >= 10 || Boolean(data.attachment), {
    message: "Submission must include at least 10 characters or an image/PDF attachment",
  });

function sanitizeSubmission(record) {
  return {
    id: record._id.toString(),
    assignmentId: record.assignmentId.toString(),
    studentId: record.studentId.toString(),
    content: record.content,
    attachment: record.attachment
      ? {
          fileName: record.attachment.fileName,
          mimeType: record.attachment.mimeType,
          data: record.attachment.data,
        }
      : null,
    submittedAt: record.submittedAt,
    grade: record.grade ?? null,
    feedback: record.feedback || "",
  };
}

router.use(authMiddleware);

router.post("/", async (req, res) => {
  try {
    if (req.user.role !== "student") {
      return res.status(403).json({ message: "Only students can submit assignment work" });
    }

    const payload = submissionSchema.parse(req.body);
    const db = getDB();

    const assignment = await db.collection("assignments").findOne({ _id: new ObjectId(payload.assignmentId) });
    if (!assignment) {
      return res.status(404).json({ message: "Assignment not found" });
    }

    const existingSubmission = await db.collection("submissions").findOne({
      assignmentId: new ObjectId(payload.assignmentId),
      studentId: new ObjectId(req.user.id),
    });

    if (existingSubmission) {
      return res.status(409).json({ message: "You have already submitted this assignment." });
    }

    const submission = {
      assignmentId: new ObjectId(payload.assignmentId),
      studentId: new ObjectId(req.user.id),
      content: payload.content?.trim() || "",
      attachment: payload.attachment
        ? {
            fileName: payload.attachment.fileName,
            mimeType: payload.attachment.mimeType,
            data: payload.attachment.data,
          }
        : null,
      submittedAt: new Date(),
      grade: null,
      feedback: null,
      createdAt: new Date(),
    };

    const result = await db.collection("submissions").insertOne(submission);
    const created = await db.collection("submissions").findOne({ _id: result.insertedId });
    return res.status(201).json({ submission: sanitizeSubmission(created) });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: error.errors.map((err) => err.message).join(", ") });
    }
    return res.status(500).json({ message: error.message });
  }
});

router.get("/", requireRole("administrator", "teacher"), async (req, res) => {
  try {
    const db = getDB();
    const submissions = await db.collection("submissions").find().toArray();
    return res.json({ submissions: submissions.map(sanitizeSubmission) });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.get("/assignment/:assignmentId", async (req, res) => {
  try {
    const db = getDB();
    const assignmentId = req.params.assignmentId;
    const query = { assignmentId: new ObjectId(assignmentId) };

    if (req.user.role === "student") {
      query.studentId = new ObjectId(req.user.id);
    }

    const submissions = await db.collection("submissions").find(query).toArray();
    return res.json({ submissions: submissions.map(sanitizeSubmission) });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.get("/student/:studentId", async (req, res) => {
  try {
    const studentId = req.params.studentId;
    if (req.user.role === "student" && req.user.id !== studentId) {
      return res.status(403).json({ message: "Access denied" });
    }

    const db = getDB();
    const submissions = await db
      .collection("submissions")
      .find({ studentId: new ObjectId(studentId) })
      .toArray();

    return res.json({ submissions: submissions.map(sanitizeSubmission) });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.put("/:id", requireRole("administrator", "teacher"), async (req, res) => {
  try {
    const payload = z.object({
      grade: z.number().optional(),
      feedback: z.string().optional(),
    }).parse(req.body);

    if (payload.grade === undefined && payload.feedback === undefined) {
      return res.status(400).json({ message: "No updates provided" });
    }

    const updates = {
      ...(payload.grade !== undefined ? { grade: payload.grade } : {}),
      ...(payload.feedback ? { feedback: payload.feedback } : {}),
    };

    const db = getDB();
    await db.collection("submissions").updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: updates },
    );
    const updated = await db.collection("submissions").findOne({ _id: new ObjectId(req.params.id) });
    return res.json({ submission: sanitizeSubmission(updated) });
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
    const result = await db.collection("submissions").deleteOne({ _id: new ObjectId(req.params.id) });
    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "Submission not found" });
    }
    return res.json({ message: "Submission deleted" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

module.exports = router;
