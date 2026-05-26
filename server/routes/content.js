const express = require("express");
const { z } = require("zod");

const authMiddleware = require("../middleware/authMiddleware");
const { requireRole } = require("../middleware/authorize");
const { getDB } = require("../config/db");
const { findUserById } = require("../models/userModel");
const {
  ANNOUNCEMENTS,
  DOCUMENTS,
  EVENTS,
  BOOKS,
  LEAVES,
  PAYSLIPS,
  TASKS,
  AUDIT,
  MESSAGES,
  MY_GRADES,
  GRADEBOOK,
} = require("../data/portalData");

const router = express.Router();
router.use(authMiddleware);

function normalizeGradeValue(value) {
  if (typeof value !== "string") return "";
  return value
    .trim()
    .toLowerCase()
    .replace(/^grade\s+/, "")
    .replace(/\s+/g, "");
}

function gradeMatches(scheduleGrade, queryGrade) {
  if (!queryGrade) return true;

  const normalizedSchedule = normalizeGradeValue(scheduleGrade);
  const normalizedQuery = normalizeGradeValue(queryGrade);

  if (!normalizedSchedule || !normalizedQuery) {
    return normalizedSchedule === normalizedQuery;
  }

  return normalizedSchedule === normalizedQuery
    || normalizedSchedule.startsWith(normalizedQuery)
    || normalizedQuery.startsWith(normalizedSchedule);
}

function normalizeMessageParticipant(value) {
  if (typeof value !== "string") return "";
  return value.trim();
}

function shouldShowMessage(message, currentUserName, currentUserEmail) {
  const currentUserKey = currentUserName || currentUserEmail;
  const from = normalizeMessageParticipant(message.from);
  const to = normalizeMessageParticipant(message.to);

  const isCurrentUserSender = from === currentUserName || from === currentUserEmail;
  const isCurrentUserRecipient = to === currentUserName || to === currentUserEmail;
  const hasReplies = Array.isArray(message.replies) && message.replies.length > 0;
  const hasCurrentUserReply = Array.isArray(message.replies)
    && message.replies.some((reply) => {
      const replyFrom = normalizeMessageParticipant(reply.from);
      return replyFrom === currentUserName || replyFrom === currentUserEmail || replyFrom === currentUserKey;
    });

  return isCurrentUserRecipient || hasReplies || hasCurrentUserReply || (!isCurrentUserSender && !isCurrentUserRecipient);
}

function timetableKey(item) {
  return JSON.stringify([
    item.day,
    item.time,
    item.subject,
    item.room,
    item.teacher,
    item.grade,
  ]);
}

function parseTeacherClasses(value) {
  return String(value || "")
    .split(/[,&]+/)
    .map((entry) => entry.trim())
    .filter(Boolean);
}

async function getTeacherGradebookScope(user) {
  if (!user || user.role !== "teacher") {
    return null;
  }

  const allowedClasses = parseTeacherClasses(user.meta?.classes);
  if (allowedClasses.length === 0) {
    return { allowedClasses: [], allowedStudentIds: [], allowedStudentEmails: [] };
  }

  const db = getDB();
  const students = await db.collection("users").find({
    role: "student",
    $or: [
      { class: { $in: allowedClasses } },
      { "meta.class": { $in: allowedClasses } },
    ],
  }).project({ studentId: 1, email: 1 }).toArray();

  return {
    allowedClasses,
    allowedStudentIds: students.map((student) => student.studentId).filter(Boolean),
    allowedStudentEmails: students.map((student) => student.email).filter(Boolean),
  };
}

function canAccessGradebookEntry(entry, scope) {
  if (!scope) {
    return true;
  }

  if (!scope.allowedStudentIds.length && !scope.allowedStudentEmails.length) {
    return false;
  }

  return Boolean(
    (entry?.id && scope.allowedStudentIds.includes(entry.id))
      || (entry?.studentEmail && scope.allowedStudentEmails.includes(entry.studentEmail)),
  );
}

function dedupeTimetable(items) {
  const seen = new Set();
  return items.filter((item) => {
    const key = timetableKey(item);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function getGradeLetter(percent) {
  if (percent >= 97) return "A+";
  if (percent >= 93) return "A";
  if (percent >= 90) return "A-";
  if (percent >= 87) return "B+";
  if (percent >= 83) return "B";
  if (percent >= 80) return "B-";
  if (percent >= 77) return "C+";
  if (percent >= 73) return "C";
  if (percent >= 70) return "C-";
  if (percent >= 60) return "D";
  return "F";
}

function getGpa(percent) {
  return Number((Math.min(Math.max(percent, 0), 100) / 25).toFixed(2));
}

function normalizeAppliedFor(value) {
  if (value === undefined || value === null) {
    throw new Error("Applied For is required");
  }

  const input = String(value).trim();
  const match = input.match(/^(?:grade\s*)?(\d{1,2})$/i);

  if (!match) {
    throw new Error("Applied For must be a grade from Grade 1 to Grade 12");
  }

  const grade = Number(match[1]);
  if (!Number.isInteger(grade) || grade < 1 || grade > 12) {
    throw new Error("Applied For must be a grade from Grade 1 to Grade 12");
  }

  return `Grade ${grade}`;
}

function normalizeScore(value) {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  const numericScore = Number(value);
  if (!Number.isFinite(numericScore)) {
    throw new Error("Score must be a number");
  }
  if (numericScore < 0 || numericScore > 100) {
    throw new Error("Score must be between 0 and 100");
  }

  return numericScore;
}

const announcementSchema = z.object({
  title: z.string().min(3, "Title is required"),
  body: z.string().min(5, "Body is required"),
  audience: z.string().min(3, "Audience is required"),
  pinned: z.boolean().optional(),
});

const eventSchema = z.object({
  title: z.string().min(3, "Title is required"),
  date: z.string().min(3, "Date is required"),
  time: z.string().min(2, "Time is required"),
  venue: z.string().min(3, "Venue is required"),
  category: z.string().min(3, "Category is required"),
  attendees: z.string().min(3, "Attendees are required"),
});

function sanitizeEvent(event) {
  return {
    id: event.id,
    title: event.title,
    date: event.date,
    time: event.time,
    venue: event.venue,
    category: event.category,
    attendees: event.attendees,
    status: event.status,
    requestedByName: event.requestedByName,
    approvedByName: event.approvedByName,
    approvedAt: event.approvedAt,
  };
}

const documentSchema = z.object({
  owner: z.string().min(1, "Owner is required"),
  name: z.string().min(1, "Document name is required"),
  type: z.string().min(1, "Document type is required"),
  size: z.string().min(1, "Document size is required"),
  data: z.string().optional(),
});

async function ensureEventsSeeded(db) {
  const count = await db.collection("events").countDocuments();
  if (count === 0 && EVENTS.length > 0) {
    const approvedEvents = EVENTS.map((event) => ({
      ...event,
      status: "approved",
      requestedByName: "System",
      approvedByName: "System",
      approvedAt: new Date().toLocaleDateString(),
    }));
    await db.collection("events").insertMany(approvedEvents);
    return approvedEvents;
  }
  return null;
}

router.get("/announcements", async (req, res) => {
  try {
    const db = getDB();
    const announcements = await db.collection("announcements").find().toArray();
    if (announcements.length === 0 && ANNOUNCEMENTS.length > 0) {
      await db.collection("announcements").insertMany(ANNOUNCEMENTS);
      return res.json({ announcements: ANNOUNCEMENTS, connected: true, source: "mongodb" });
    }
    return res.json({ announcements: announcements.length > 0 ? announcements : ANNOUNCEMENTS, connected: true, source: "mongodb" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.post("/announcements", requireRole("administrator"), async (req, res) => {
  try {
    const payload = announcementSchema.parse(req.body);
    const db = getDB();
    const currentUser = await findUserById(req.user.id);
    const announcement = {
      id: `A-${Date.now()}`,
      title: payload.title,
      body: payload.body,
      audience: payload.audience,
      pinned: payload.pinned || false,
      postedBy: currentUser?.name || currentUser?.email || req.user.email || "Administrator",
      postedAt: new Date().toLocaleDateString(),
    };

    await db.collection("announcements").insertOne(announcement);
    return res.status(201).json({ announcement });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: error.errors.map((err) => err.message).join(", ") });
    }
    return res.status(500).json({ message: error.message });
  }
});

router.delete("/announcements/:id", requireRole("administrator"), async (req, res) => {
  try {
    const db = getDB();
    const result = await db.collection("announcements").deleteOne({ id: req.params.id });
    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "Announcement not found" });
    }
    return res.json({ message: "Announcement deleted" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.post("/messages/reply", async (req, res) => {
  try {
    const { messageId, body } = req.body || {};
    if (!messageId || !body || String(body).trim().length === 0) {
      return res.status(400).json({ message: "messageId and body are required" });
    }

    let displayName = req.user?.name || req.user?.email || null;
    if (!displayName && req.user?.id) {
      const currentUser = await findUserById(req.user.id);
      displayName = currentUser?.name || currentUser?.email || null;
    }

    const db = getDB();
    const reply = {
      id: `R-${Date.now()}`,
      from: displayName || "Unknown",
      body: String(body),
      at: "Just now",
    };

    const result = await db.collection("messages").updateOne(
      { id: messageId },
      { $push: { replies: reply } },
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: "Message not found" });
    }

    const message = await db.collection("messages").findOne({ id: messageId });
    return res.status(201).json({ message });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

async function ensureDocumentsSeeded(db) {
  const count = await db.collection("documents").countDocuments();
  if (count === 0 && DOCUMENTS.length > 0) {
    await db.collection("documents").insertMany(
      DOCUMENTS.map((document) => ({
        ...document,
        content: null,
      })),
    );
    return DOCUMENTS;
  }
  return null;
}

async function ensureBooksSeeded(db) {
  const count = await db.collection("books").countDocuments();
  if (count === 0 && BOOKS.length > 0) {
    await db.collection("books").insertMany(BOOKS);
    return BOOKS;
  }
  return null;
}

router.get("/documents", async (req, res) => {
  try {
    const db = getDB();
    await ensureDocumentsSeeded(db);
    const documents = await db.collection("documents").find({}).toArray();
    return res.json({ documents: documents.length > 0 ? documents : DOCUMENTS });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.post("/documents", requireRole("administrator", "admission", "teacher"), async (req, res) => {
  try {
    const payload = documentSchema.parse(req.body);
    const db = getDB();
    const document = {
      id: `D-${Date.now()}`,
      owner: payload.owner,
      name: payload.name,
      type: payload.type,
      size: payload.size,
      uploaded: new Date().toLocaleDateString(),
      content: payload.data || null,
      uploadedBy: req.user?.name || req.user?.email || "Unknown",
    };

    await db.collection("documents").insertOne(document);
    return res.status(201).json({ document: { ...document, content: undefined } });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: error.errors.map((err) => err.message).join(", ") });
    }
    return res.status(500).json({ message: error.message });
  }
});

router.get("/events", async (req, res) => {
  try {
    const db = getDB();
    await ensureEventsSeeded(db);

    const approvedEvents = await db.collection("events").find({ status: "approved" }).toArray();
    const response = {
      events: approvedEvents.map(sanitizeEvent),
      connected: true,
      source: "mongodb",
    };

    if (req.user.role === "administrator") {
      const pendingRequests = await db.collection("events").find({ status: "pending" }).toArray();
      response.requests = pendingRequests.map(sanitizeEvent);
    }

    return res.json(response);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.post("/events", async (req, res) => {
  try {
    const payload = eventSchema.parse(req.body);
    const db = getDB();
    const isAdmin = req.user.role === "administrator";

    const event = {
      id: `E-${Date.now()}`,
      title: payload.title,
      date: payload.date,
      time: payload.time,
      venue: payload.venue,
      category: payload.category,
      attendees: payload.attendees,
      status: isAdmin ? "approved" : "pending",
      requestedByName: req.user.name || req.user.email,
      requestedById: req.user.id,
      approvedByName: isAdmin ? req.user.name || req.user.email : null,
      approvedAt: isAdmin ? new Date().toLocaleDateString() : null,
      createdAt: new Date(),
    };

    await db.collection("events").insertOne(event);
    return res.status(201).json({ event: sanitizeEvent(event) });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: error.errors.map((err) => err.message).join(", ") });
    }
    return res.status(500).json({ message: error.message });
  }
});

router.put("/events/:id/approve", requireRole("administrator"), async (req, res) => {
  try {
    const db = getDB();
    const result = await db.collection("events").findOneAndUpdate(
      { id: req.params.id, status: "pending" },
      {
        $set: {
          status: "approved",
          approvedByName: req.user.name || req.user.email,
          approvedAt: new Date().toLocaleDateString(),
        },
      },
      { returnDocument: "after" },
    );

    if (!result.value) {
      return res.status(404).json({ message: "Pending event request not found" });
    }
    return res.json({ event: sanitizeEvent(result.value) });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.delete("/events/:id", requireRole("administrator"), async (req, res) => {
  try {
    const db = getDB();
    const result = await db.collection("events").deleteOne({ id: req.params.id });
    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "Event not found" });
    }
    return res.json({ message: "Event deleted" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});
router.get("/library", async (req, res) => {
  try {
    const db = getDB();
    await ensureBooksSeeded(db);
    const books = await db.collection("books").find({}).toArray();
    return res.json({ books: books.length > 0 ? books : BOOKS });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});
router.get("/tasks", (req, res) => res.json({ tasks: TASKS }));
router.get("/messages", async (req, res) => {
  try {
    const db = getDB();
    const currentUser = await findUserById(req.user.id);
    const currentUserName = currentUser?.name || req.user?.name || null;
    const currentUserEmail = currentUser?.email || req.user?.email || null;
    const messages = await db.collection("messages").find().toArray();

    const visibleMessages = messages.filter((message) => shouldShowMessage(message, currentUserName, currentUserEmail));

    if (messages.length === 0 && MESSAGES.length > 0) {
      const seededMessages = MESSAGES.map((message) => ({ ...message, replies: message.replies || [] }));
      await db.collection("messages").insertMany(seededMessages);
      return res.json({ messages: seededMessages.filter((message) => shouldShowMessage(message, currentUserName, currentUserEmail)) });
    }

    return res.json({ messages: visibleMessages.length > 0 ? visibleMessages : MESSAGES.filter((message) => shouldShowMessage(message, currentUserName, currentUserEmail)) });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.post("/messages", async (req, res) => {
  try {
    const { subject, body, to } = req.body || {};
    if (!subject || !body || String(subject).trim().length === 0 || String(body).trim().length === 0) {
      return res.status(400).json({ message: "Subject and body are required" });
    }

    const db = getDB();
    const currentUser = await findUserById(req.user.id);
    const from = currentUser?.name || currentUser?.email || req.user?.email || req.user?.name || "Unknown";
    const message = {
      id: `M-${Date.now()}`,
      from,
      to: to ? String(to) : undefined,
      subject: String(subject),
      preview: String(body).slice(0, 120),
      body: String(body),
      at: "Just now",
      unread: true,
      replies: [],
    };

    await db.collection("messages").insertOne(message);
    return res.status(201).json({ message });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.get("/inquiries", async (req, res) => {
  try {
    const db = getDB();
    const inquiries = await db.collection("inquiries").find().toArray();
    return res.json({ inquiries });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.put("/inquiries/:id", requireRole("administrator", "admission"), async (req, res) => {
  try {
    const { status } = req.body || {};
    if (!status) {
      return res.status(400).json({ message: "Status is required" });
    }

    const db = getDB();
    const inquiry = await db.collection("inquiries").findOne({ id: req.params.id });
    if (!inquiry) {
      return res.status(404).json({ message: "Inquiry not found" });
    }

    if (String(status) === "Approved") {
      const application = {
        id: `AP-${Date.now()}`,
        applicant: inquiry.parent,
        appliedFor: inquiry.interestedIn,
        date: new Date().toLocaleDateString(),
        stage: "New",
        applicantType: "student",
        inquiryId: inquiry.id,
        email: inquiry.email,
        phone: inquiry.phone,
      };
      await db.collection("applications").insertOne(application);
      await db.collection("inquiries").deleteOne({ id: inquiry.id });
      return res.json({ application, message: "Inquiry approved and moved to applications" });
    }

    const updated = await db.collection("inquiries").findOneAndUpdate(
      { id: req.params.id },
      { $set: { status: String(status) } },
      { returnDocument: "after" },
    );

    return res.json({ inquiry: updated.value });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.get("/enrollments", requireRole("administrator", "admission"), async (req, res) => {
  try {
    const db = getDB();
    const enrollments = await db.collection("enrollments").find().toArray();
    return res.json({ enrollments });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.put("/applications/:id/confirm", requireRole("administrator", "admission"), async (req, res) => {
  try {
    const db = getDB();
    const application = await db.collection("applications").findOne({ id: req.params.id });
    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }

    const enrollment = {
      id: `ENR-${Date.now()}`,
      ...application,
      stage: "Confirmed",
      enrollmentStatus: "Pending",
      confirmedAt: new Date().toLocaleDateString(),
      sourceApplicationId: application.id,
    };
    await db.collection("enrollments").insertOne(enrollment);
    await db.collection("applications").deleteOne({ id: application.id });
    // Create provisional student and user records so the student shows up
    // in the Students list and dashboard immediately. These can be completed
    // during the enrollment step when an email and parent mobile are provided.
    try {
      const studentId = enrollment.studentId || `STU-${new Date().getFullYear()}-${String(Date.now() % 1000).padStart(3, "0")}`;

      const existingStudent = await db.collection("students").findOne({ id: studentId });
      if (!existingStudent) {
        const provisionalStudent = {
          id: studentId,
          studentId,
          name: enrollment.applicant,
          email: enrollment.email || null,
          role: "student",
          status: "pending",
          meta: { class: enrollment.appliedFor },
          enrolledAt: new Date().toLocaleDateString(),
        };
        await db.collection("students").insertOne(provisionalStudent);
      }

      const existingUser = await db.collection("users").findOne({ id: studentId });
      if (!existingUser) {
        await db.collection("users").insertOne({
          id: studentId,
          name: enrollment.applicant,
          email: enrollment.email || null,
          role: "student",
          passwordHash: null,
          createdAt: new Date(),
        });
      }
    } catch (err) {
      // Non-fatal: log but continue returning success to client
      console.error("Failed to create provisional student/user:", err);
    }

    return res.json({ enrollment, message: "Application moved to enrollment" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.post("/enrollments/:id/enroll", requireRole("administrator", "admission"), async (req, res) => {
  try {
    const db = getDB();
    const { email, parentMobile } = req.body;

    // Validate email and parent mobile number
    if (!email || !email.includes("@")) {
      return res.status(400).json({ message: "Valid email address is required" });
    }
    if (!parentMobile || parentMobile.toString().trim().length < 7) {
      return res.status(400).json({ message: "Parent's mobile number is required" });
    }

    const enrollment = await db.collection("enrollments").findOne({ id: req.params.id });
    if (!enrollment) {
      return res.status(404).json({ message: "Enrollment record not found" });
    }

    // Check if email already exists
    const existingUser = await db.collection("users").findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already exists in the system" });
    }

    const studentId = enrollment.studentId || `STU-${new Date().getFullYear()}-${String(Date.now() % 1000).padStart(3, "0")}`;
    const student = {
      id: studentId,
      studentId,
      name: enrollment.applicant,
      email: email,
      parentMobile: parentMobile,
      role: "student",
      status: "active",
      meta: { class: enrollment.appliedFor },
      enrolledAt: new Date().toLocaleDateString(),
    };

    // Upsert student and user to avoid duplicates and ensure provisional records get completed
    try {
      const studentResult = await db.collection("students").updateOne({ id: studentId }, { $set: student }, { upsert: true });
      console.log(`Upserted student ${studentId}`, studentResult.result || studentResult);
    } catch (err) {
      console.error("Failed to upsert student:", err);
      throw err;
    }

    try {
      const userDoc = {
        id: studentId,
        name: enrollment.applicant,
        email: email,
        role: "student",
        parentMobile: parentMobile,
        passwordHash: null,
        createdAt: new Date(),
      };
      const userResult = await db.collection("users").updateOne({ id: studentId }, { $set: userDoc }, { upsert: true });
      console.log(`Upserted user ${studentId}`, userResult.result || userResult);
    } catch (err) {
      console.error("Failed to upsert user:", err);
      throw err;
    }
    await db.collection("enrollments").updateOne(
      { id: enrollment.id },
      { $set: { enrollmentStatus: "Enrolled", enrolledAt: new Date().toLocaleDateString(), studentId, email, parentMobile } },
    );

    const message = {
      id: `M-${Date.now()}`,
      from: req.user.name || req.user.email,
      to: "administrator",
      subject: `Enrollment completed for ${student.name}`,
      preview: `${student.name} has been added as a student.`,
      body: `${student.name} (${student.studentId}) has been enrolled with email ${email} and added to the student directory.`,
      at: "Just now",
      unread: true,
      replies: [],
    };
    await db.collection("messages").insertOne(message);

    const updatedEnrollment = await db.collection("enrollments").findOne({ id: enrollment.id });
    // Compute updated analytics snapshot to return so frontend can update dashboard immediately
    try {
      const totalStudents = await db.collection("users").countDocuments({ role: "student" });
      const totalTeachers = await db.collection("users").countDocuments({ role: "teacher" });
      // Count staff broadly so admins/admissions are included as staff-type users
      const totalStaff = await db.collection("users").countDocuments({ role: { $in: ["staff", "administrator", "admission"] } });

      const [feeStats] = await db
        .collection("fees")
        .aggregate([
          { $group: { _id: null, totalCollected: { $sum: "$amount" }, payments: { $sum: 1 } } },
        ])
        .toArray();

      const totalCourses = await db.collection("courses").countDocuments();

      const studentTrend = await db
        .collection("users")
        .aggregate([
          { $match: { role: "student" } },
          { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, count: { $sum: 1 } } },
          { $sort: { _id: 1 } },
        ])
        .toArray();

      const analytics = {
        totals: {
          students: totalStudents,
          teachers: totalTeachers,
          staff: totalStaff,
          courses: totalCourses,
        },
        fees: {
          totalCollected: feeStats?.totalCollected || 0,
          totalPayments: feeStats?.payments || 0,
        },
        studentTrend,
      };

      return res.status(201).json({ student, enrollment: updatedEnrollment, message: "Student enrolled and administrator notified.", analytics });
    } catch (err) {
      // If analytics calculation fails, still return success for enrollment
      console.error("Failed to compute analytics after enroll:", err);
      return res.status(201).json({ student, enrollment: updatedEnrollment, message: "Student enrolled and administrator notified." });
    }
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.get("/students", requireRole("administrator", "admission", "teacher"), async (req, res) => {
  try {
    const db = getDB();
    const students = await db.collection("users").find({ role: "student" }).toArray();
    return res.json({
      students: students.map((student) => ({
        id: student._id.toString(),
        studentId: student.studentId || student._id.toString(),
        name: student.name,
        email: student.email,
        role: student.role,
        class: student.class || student.meta?.class || null,
        meta: student.meta || {},
      })),
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.post("/students", requireRole("administrator", "admission"), async (req, res) => {
  try {
    const { studentId, name, email, password, meta } = req.body || {};
    if (!name || !email) {
      return res.status(400).json({ message: "Name and email are required" });
    }

    const db = getDB();
    const id = studentId || `STU-${new Date().getFullYear()}-${String(Date.now() % 1000).padStart(3, "0")}`;
    const student = {
      id,
      studentId: id,
      name: String(name),
      email: String(email),
      role: "student",
      status: "active",
      meta: meta || {},
      enrolledAt: new Date().toLocaleDateString(),
      password: password ? String(password) : undefined,
    };

    await db.collection("students").insertOne(student);
    return res.status(201).json({ student });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.delete("/students/:id", requireRole("administrator", "admission"), async (req, res) => {
  try {
    const db = getDB();
    const result = await db.collection("students").deleteOne({ id: req.params.id });
    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "Student not found" });
    }
    return res.json({ message: "Student deleted" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.get("/timetable", async (req, res) => {
  try {
    const db = getDB();
    const grade = typeof req.query.grade === "string" ? req.query.grade.trim() : "";
    const collection = db.collection("timetable");
    const timetable = dedupeTimetable(await collection.find({}).toArray());

    const filteredTimetable = grade
      ? timetable.filter((item) => gradeMatches(item.grade, grade))
      : timetable;

    return res.json({ timetable: filteredTimetable });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.post("/timetable", requireRole("administrator", "teacher"), async (req, res) => {
  try {
    const { day, time, subject, room, teacher, grade } = req.body || {};
    if (!day || !time || !subject || !room) {
      return res.status(400).json({ message: "day, time, subject and room are required" });
    }
    const db = getDB();
    const timetableItem = {
      day: String(day),
      time: String(time),
      subject: String(subject),
      room: String(room),
      teacher: String(teacher || req.user.name || "TBD"),
      grade: grade ? String(grade) : null,
    };
    await db.collection("timetable").insertOne(timetableItem);
    return res.status(201).json({ timetable: timetableItem });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});
router.get("/applications", requireRole("administrator", "admission"), async (req, res) => {
  try {
    const db = getDB();
    const query = {};

    if (req.user.role === "admission") {
      query.$or = [
        { applicantType: "student" },
        { applicantType: { $exists: false } },
      ];
    }

    const applications = await db.collection("applications").find(query).toArray();
    return res.json({
      applications: applications.map((application) => ({
        ...application,
        applicantType: application.applicantType || "student",
      })),
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.post("/applications", requireRole("administrator", "admission"), async (req, res) => {
  try {
    const { applicant, appliedFor, date, stage, score, applicantType } = req.body || {};
    if (!applicant || !appliedFor || !stage) {
      return res.status(400).json({ message: "applicant, appliedFor, and stage are required" });
    }

    const normalizedAppliedFor = normalizeAppliedFor(appliedFor);
    const normalizedScore = normalizeScore(score);

    const db = getDB();
    const id = `AP-${Date.now()}`;
    const application = {
      id,
      applicant: String(applicant),
      appliedFor: normalizedAppliedFor,
      date: date || new Date().toLocaleDateString(),
      stage: String(stage),
      ...(normalizedScore !== undefined ? { score: normalizedScore } : {}),
      applicantType: String(applicantType || "student"),
    };

    await db.collection("applications").insertOne(application);
    return res.status(201).json({ application });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
});

router.put("/applications/:id", requireRole("administrator", "admission"), async (req, res) => {
  try {
    const { applicant, appliedFor, stage, score, applicantType } = req.body || {};
    const id = req.params.id;

    const db = getDB();
    const updates = {};
    if (applicant) updates.applicant = String(applicant);
    if (appliedFor) updates.appliedFor = normalizeAppliedFor(appliedFor);
    if (stage) updates.stage = String(stage);
    if (score !== undefined && score !== null) updates.score = normalizeScore(score);
    if (applicantType) updates.applicantType = String(applicantType);
    
    // Auto-generate student ID when approved
    if (stage && stage === "Approved") {
      const currentApp = await db.collection("applications").findOne({ id });
      if (currentApp && !currentApp.studentId) {
        // Generate unique student ID: STU-YYYY-###
        const year = new Date().getFullYear();
        const approvedApps = await db.collection("applications").find({ stage: "Approved", studentId: { $exists: true } }).toArray();
        const count = approvedApps.length + 1;
        updates.studentId = `STU-${year}-${String(count).padStart(3, "0")}`;
      }
    }
    
    const result = await db.collection("applications").updateOne({ id }, { $set: updates });
    if (result.matchedCount === 0) {
      return res.status(404).json({ message: "Application not found" });
    }
    
    const updated = await db.collection("applications").findOne({ id });
    return res.json({ application: updated });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.delete("/applications/:id", requireRole("administrator", "admission"), async (req, res) => {
  try {
    const id = req.params.id;
    const db = getDB();
    
    const result = await db.collection("applications").deleteOne({ id });
    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "Application not found" });
    }
    
    return res.json({ message: "Application deleted" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});
router.get("/leaves", (req, res) => res.json({ leaves: LEAVES }));
router.get("/gradebook", async (req, res) => {
  try {
    const db = getDB();
    const teacherScope = await getTeacherGradebookScope(req.user);
    let gradebook = await db.collection("gradebook").find().toArray();

    if (gradebook.length === 0 && GRADEBOOK.length > 0) {
      const seeded = GRADEBOOK.map((entry) => ({
        ...entry,
        course: entry.course || "Algebra I",
        teacher: entry.teacher || "J. Carter",
      }));
      await db.collection("gradebook").insertMany(seeded);
      gradebook = seeded;
    }

    if (teacherScope) {
      gradebook = gradebook.filter((entry) => canAccessGradebookEntry(entry, teacherScope));
    }

    return res.json({ gradebook: gradebook.length > 0 ? gradebook : [] });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.get("/grades/mine", async (req, res) => {
  try {
    const db = getDB();
    const query = { $or: [{ studentEmail: req.user.email }, { name: req.user.name }] };
    const studentGrades = await db.collection("gradebook").find(query).toArray();
    if (studentGrades.length > 0) {
      const grades = studentGrades.map((entry) => ({
        course: entry.course || "Algebra I",
        teacher: entry.teacher || entry.teacher || "Teacher",
        grade: entry.grade,
        percent: entry.percent,
        trend: entry.trend || "flat",
      }));
      return res.json({ grades });
    }

    const grades = MY_GRADES;
    return res.json({ grades });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.post("/gradebook", requireRole("teacher"), async (req, res) => {
  try {
    const { id, quiz1, midterm, project, final } = req.body || {};
    if (!id || quiz1 == null || midterm == null || project == null || final == null) {
      return res.status(400).json({ message: "Student id and all score fields are required" });
    }

    const db = getDB();
    const teacherScope = await getTeacherGradebookScope(req.user);
    if (teacherScope && !canAccessGradebookEntry({ id }, teacherScope)) {
      return res.status(403).json({ message: "You can only grade students in your assigned classes" });
    }

    const existing = await db.collection("gradebook").findOne({ id });
    const student = existing
      ? null
      : await db.collection("users").findOne({ studentId: id, role: "student" });

    const percent = Math.round((Number(quiz1) + Number(midterm) + Number(project) + Number(final)) / 4);
    const grade = getGradeLetter(percent);
    const gpa = getGpa(percent);

    const updateDoc = {
      $set: {
        id,
        quiz1: Number(quiz1),
        midterm: Number(midterm),
        project: Number(project),
        final: Number(final),
        percent,
        grade,
        gpa,
        course: existing?.course || req.body.course || "Algebra I",
        teacher: req.user.name,
        name: existing?.name || student?.name || req.body.name,
        studentEmail: existing?.studentEmail || student?.email || req.body.studentEmail,
        trend: existing?.trend || "flat",
      },
    };

    const result = await db.collection("gradebook").updateOne({ id }, updateDoc, { upsert: true });
    const updated = await db.collection("gradebook").findOne({ id });
    return res.status(result.upsertedCount > 0 ? 201 : 200).json({ gradebook: updated });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.get("/payslips/mine", (req, res) => {
  const payslips = req.user.role === "staff" || req.user.role === "administrator" ? PAYSLIPS : [];
  return res.json({ payslips });
});
router.get("/audit", requireRole("administrator"), (req, res) => res.json({ audit: AUDIT }));

module.exports = router;
