const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const { ObjectId } = require("mongodb");
const { getDB } = require("../config/db");
const { createUser, findUserByEmail, findUserById, findUserByRefreshToken, updateUserRefreshToken } = require("../models/userModel");
const { registerSchema, loginSchema, forgotPasswordSchema } = require("../validators/authValidator");

const JWT_SECRET = process.env.JWT_SECRET || "supersecret";
const ACCESS_TOKEN_AGE = 15 * 60 * 1000;
const REFRESH_TOKEN_AGE = 7 * 24 * 60 * 60 * 1000;

const sanitizeUser = (user) => {
  if (!user) return null;
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    class: user.class || null,
    section: user.section || null,
    classId: user.classId ? user.classId.toString() : null,
    sectionId: user.sectionId ? user.sectionId.toString() : null,
    admissionNumber: user.admissionNumber || null,
    rollNumber: user.rollNumber || null,
    meta: user.meta || {},
  };
};

const createAccessToken = (user, csrfToken) => jwt.sign(
  {
    id: user._id.toString(),
    role: user.role,
    name: user.name,
    email: user.email,
    meta: user.meta || {},
    csrfToken,
  },
  JWT_SECRET,
  { expiresIn: "15m" },
);

const createRefreshToken = () => crypto.randomBytes(64).toString("hex");
const createCsrfToken = () => crypto.randomBytes(32).toString("hex");

const setAuthenticationCookies = (res, accessToken, refreshToken, csrfToken) => {
  const isProduction = process.env.NODE_ENV === "production";
  res.cookie("access_token", accessToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    maxAge: ACCESS_TOKEN_AGE,
    path: "/",
  });
  res.cookie("refresh_token", refreshToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    maxAge: REFRESH_TOKEN_AGE,
    path: "/",
  });
  res.cookie("csrf_token", csrfToken, {
    httpOnly: false,
    secure: isProduction,
    sameSite: "lax",
    maxAge: ACCESS_TOKEN_AGE,
    path: "/",
  });
};

const clearAuthenticationCookies = (res) => {
  res.clearCookie("access_token", { path: "/" });
  res.clearCookie("refresh_token", { path: "/" });
  res.clearCookie("csrf_token", { path: "/" });
};

const getRefreshTokenFromRequest = (req) => {
  if (req.cookies?.refresh_token) {
    return req.cookies.refresh_token;
  }
  const cookieHeader = req.headers.cookie;
  if (!cookieHeader) return null;
  const cookies = cookieHeader.split(";").map((cookie) => cookie.trim());
  for (const cookie of cookies) {
    const [name, value] = cookie.split("=");
    if (name === "refresh_token") {
      return decodeURIComponent(value || "");
    }
  }
  return null;
};

const register = async (req, res) => {
  const payload = registerSchema.parse(req.body);
  const existing = await findUserByEmail(payload.email);
  if (existing) {
    return res.status(400).json({ message: "User already exists" });
  }

  const hashedPassword = await bcrypt.hash(payload.password, 10);
  const user = await createUser({ ...payload, password: hashedPassword });
  const csrfToken = createCsrfToken();
  const accessToken = createAccessToken(user, csrfToken);
  const refreshToken = createRefreshToken();
  await updateUserRefreshToken(user._id.toString(), refreshToken);
  setAuthenticationCookies(res, accessToken, refreshToken, csrfToken);
  return res.status(201).json({ user: sanitizeUser(user), accessToken, csrfToken });
};

const login = async (req, res) => {
  const payload = loginSchema.parse(req.body);
  const user = await findUserByEmail(payload.email);
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  const isValid = await bcrypt.compare(payload.password, user.password);
  if (!isValid) {
    return res.status(401).json({ message: "Invalid email or password" });
  }

  const csrfToken = createCsrfToken();
  const accessToken = createAccessToken(user, csrfToken);
  const refreshToken = createRefreshToken();
  await updateUserRefreshToken(user._id.toString(), refreshToken);
  setAuthenticationCookies(res, accessToken, refreshToken, csrfToken);
  return res.json({ user: sanitizeUser(user), accessToken, csrfToken });
};

const refreshToken = async (req, res) => {
  const token = getRefreshTokenFromRequest(req);
  if (!token) {
    return res.status(401).json({ message: "Refresh token required" });
  }

  const user = await findUserByRefreshToken(token);
  if (!user) {
    clearAuthenticationCookies(res);
    return res.status(401).json({ message: "Invalid refresh token" });
  }

  const csrfToken = createCsrfToken();
  const newAccessToken = createAccessToken(user, csrfToken);
  const newRefreshToken = createRefreshToken();
  await updateUserRefreshToken(user._id.toString(), newRefreshToken);
  setAuthenticationCookies(res, newAccessToken, newRefreshToken, csrfToken);
  return res.json({ user: sanitizeUser(user), accessToken: newAccessToken, csrfToken });
};

const logout = async (req, res) => {
  const token = getRefreshTokenFromRequest(req);
  if (token) {
    await updateUserRefreshToken(token, null, { lookupRefreshToken: true });
  }

  if (req.headers.authorization?.startsWith("Bearer ")) {
    try {
      const decoded = jwt.verify(req.headers.authorization.split(" ")[1], JWT_SECRET);
      if (decoded?.id) {
        await updateUserRefreshToken(decoded.id, null);
      }
    } catch {
      // ignore invalid token during logout
    }
  }

  clearAuthenticationCookies(res);
  return res.json({ message: "Successfully logged out" });
};

const forgotPassword = async (req, res) => {
  const payload = forgotPasswordSchema.parse(req.body);
  const user = await findUserByEmail(payload.email);

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  const hashedPassword = await bcrypt.hash(payload.newPassword, 10);
  const db = getDB();

  await db.collection("users").updateOne(
    { _id: user._id },
    { $set: { password: hashedPassword, refreshToken: null } },
  );

  await updateUserRefreshToken(user._id.toString(), null);

  return res.json({ message: "Password updated successfully. You can sign in with your new password." });
};

const me = async (req, res) => {
  const user = await findUserById(req.user.id);
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }
  return res.json({ user: sanitizeUser(user) });
};

module.exports = {
  register,
  login,
  refreshToken,
  logout,
  me,
  forgotPassword,
};
