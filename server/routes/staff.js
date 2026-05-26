const express = require("express");
const bcrypt = require("bcryptjs");
const { ObjectId } = require("mongodb");
const { z } = require("zod");

const { getDB } = require("../config/db");
const authMiddleware = require("../middleware/authMiddleware");
const { requireRole } = require("../middleware/authorize");

const router = express.Router();

const createStaffSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(["administrator", "teacher", "staff", "admission"]).optional(),
  meta: z.record(z.string()).optional(),
});

const updateStaffSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  password: z.string().min(8).optional(),
  meta: z.record(z.string()).optional(),
});

function sanitizeUser(user) {
  if (!user) return null;
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    meta: user.meta || {},
  };
}

router.use(authMiddleware);

router.get("/", requireRole("administrator"), async (req, res) => {
  try {
    const db = getDB();
    const staff = await db
      .collection("users")
      .find({ role: { $in: ["administrator", "teacher", "staff", "admission"] } })
      .project({ password: 0, refreshToken: 0 })
      .toArray();

    return res.json({ staff: staff.map(sanitizeUser) });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.post("/", requireRole("administrator"), async (req, res) => {
  try {
    const payload = createStaffSchema.parse(req.body);
    const db = getDB();

    const existing = await db.collection("users").findOne({ email: payload.email });
    if (existing) {
      return res.status(400).json({ message: "Email already exists" });
    }

    const hashedPassword = await bcrypt.hash(payload.password, 10);
    const userRole = payload.role || "staff";

    const result = await db.collection("users").insertOne({
      name: payload.name,
      email: payload.email,
      password: hashedPassword,
      role: userRole,
      meta: payload.meta || {},
      createdAt: new Date(),
      refreshToken: null,
    });

    const staffUser = await db.collection("users").findOne({ _id: result.insertedId });
    return res.status(201).json({ staff: sanitizeUser(staffUser) });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: error.errors.map((err) => err.message).join(", ") });
    }
    return res.status(500).json({ message: error.message });
  }
});

router.put("/:id", requireRole("administrator"), async (req, res) => {
  try {
    const payload = updateStaffSchema.parse(req.body);
    const db = getDB();
    const id = req.params.id;

    const updates = {
      ...(payload.name ? { name: payload.name } : {}),
      ...(payload.email ? { email: payload.email } : {}),
      ...(payload.meta ? { meta: payload.meta } : {}),
    };

    if (payload.password) {
      updates.password = await bcrypt.hash(payload.password, 10);
    }

    await db.collection("users").updateOne(
      { _id: new ObjectId(id), role: { $in: ["administrator", "teacher", "staff", "admission"] } },
      { $set: updates },
    );

    const staffUser = await db.collection("users").findOne({ _id: new ObjectId(id) });
    if (!staffUser) {
      return res.status(404).json({ message: "Staff user not found" });
    }

    return res.json({ staff: sanitizeUser(staffUser) });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: error.errors.map((err) => err.message).join(", ") });
    }
    return res.status(500).json({ message: error.message });
  }
});

router.get("/:id", requireRole("administrator"), async (req, res) => {
  try {
    const db = getDB();
    const staffUser = await db.collection("users").findOne({
      _id: new ObjectId(req.params.id),
      role: { $in: ["administrator", "teacher", "staff", "admission"] },
    });

    if (!staffUser) {
      return res.status(404).json({ message: "Staff user not found" });
    }

    return res.json({ staff: sanitizeUser(staffUser) });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.delete("/:id", requireRole("administrator"), async (req, res) => {
  try {
    const db = getDB();
    const result = await db.collection("users").deleteOne({ _id: new ObjectId(req.params.id), role: { $in: ["administrator", "teacher", "staff", "admission"] } });
    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "Staff user not found" });
    }
    return res.json({ message: "Staff user deleted" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

module.exports = router;
