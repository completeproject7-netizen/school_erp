const path = require("path");

require("dotenv").config({ path: path.resolve(__dirname, "../.env") });
require("dotenv").config({ path: path.resolve(__dirname, ".env") });

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const cookieParser = require("cookie-parser");
const morgan = require("morgan");

const { connectDB } = require("./config/db");

const authRoutes = require("./routes/auth");
const studentRoutes = require("./routes/students");
const staffRoutes = require("./routes/staff");
const analyticsRoutes = require("./routes/analytics");
const classRoutes = require("./routes/classes");
const auditRoutes = require("./routes/audit");
const courseRoutes = require("./routes/courses");
const attendanceRoutes = require("./routes/attendance");
const feesRoutes = require("./routes/fees");
const assignmentsRoutes = require("./routes/assignments");
const submissionsRoutes = require("./routes/submissions");
const contentRoutes = require("./routes/content");
const errorHandler = require("./middleware/errorHandler");

const app = express();

const allowedOrigins = [
  process.env.FRONTEND_ORIGIN,
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:4173",
  "http://127.0.0.1:4173",
].filter(Boolean);

function isAllowedOrigin(origin) {
  if (!origin) return true;

  try {
    const url = new URL(origin);
    if (
      url.protocol === "http:" &&
      ["localhost", "127.0.0.1", "::1"].includes(url.hostname)
    ) {
      return true;
    }
  } catch {
    return false;
  }

  return allowedOrigins.includes(origin);
}

app.use(helmet());
app.use(morgan("combined"));
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === "production" ? 120 : 600,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    if (process.env.NODE_ENV === "production") return false;
    return ["/api/auth/me", "/api/auth/refresh", "/api/auth/login", "/api/auth/register"].includes(req.path);
  },
}));
app.use(cookieParser());

app.use(
  cors({
    origin: (origin, callback) => {
      if (isAllowedOrigin(origin)) {
        return callback(null, true);
      }
      return callback(new Error("CORS policy: Origin not allowed"));
    },
    credentials: true,
  }),
);
app.use(express.json({ limit: "5mb" }));
app.set("trust proxy", 1);

app.use("/api/auth", authRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/staff", staffRoutes);
app.use("/api/classes", classRoutes);
app.use("/api/audit", auditRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/fees", feesRoutes);
app.use("/api/assignments", assignmentsRoutes);
app.use("/api/submissions", submissionsRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api", contentRoutes);

app.use(express.static(path.join(__dirname, "../dist")));

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../dist/index.html"));
});

app.use(errorHandler);

const PORT = process.env.PORT || 5000;

connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Failed to start server due to MongoDB connection error:", error);
    process.exit(1);
  });