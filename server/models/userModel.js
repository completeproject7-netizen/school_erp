const { ObjectId } = require("mongodb");
const { getDB } = require("../config/db");

const generateStudentId = () => {
  return `S-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, "0")}`;
};

const resolveStudentClass = (user) => user?.class ?? user?.meta?.class ?? null;

const normalizeMeta = (user) => {
  const meta = typeof user?.meta === "object" && user.meta !== null ? { ...user.meta } : {};
  const resolvedClass = resolveStudentClass(user);

  if (resolvedClass) {
    meta.class = resolvedClass;
  } else if (meta.class === undefined) {
    meta.class = null;
  }

  return meta;
};

const toPublicUser = (user) => {
  if (!user) return null;

  const resolvedClass = resolveStudentClass(user);

  return {
    id: user._id.toString(),
    studentId: user.studentId || user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    class: resolvedClass,
    section: user.section || null,
    classId: user.classId ? user.classId.toString() : null,
    sectionId: user.sectionId ? user.sectionId.toString() : null,
    admissionNumber: user.admissionNumber || null,
    rollNumber: user.rollNumber || null,
    meta: normalizeMeta(user),
    createdAt: user.createdAt,
  };
};

const findStudents = async (query = {}) => {
  const db = getDB();
  return db
    .collection("users")
    .find({ role: "student", ...query })
    .project({ password: 0, refreshToken: 0 })
    .toArray();
};

const findStudentById = async (id) => {
  if (!ObjectId.isValid(id)) return null;
  const db = getDB();
  return db.collection("users").findOne({ _id: new ObjectId(id), role: "student" });
};

const findStudentByEmail = async (email) => {
  const db = getDB();
  return db.collection("users").findOne({ email, role: "student" });
};

const findUserByEmail = async (email) => {
  const db = getDB();
  return db.collection("users").findOne({ email });
};

const findUserById = async (id) => {
  if (!ObjectId.isValid(id)) return null;
  const db = getDB();
  return db.collection("users").findOne({ _id: new ObjectId(id) });
};

const normalizeStudentPayload = (payload) => {
  const resolvedClass = payload.class ?? payload.meta?.class ?? null;
  const meta = typeof payload.meta === "object" && payload.meta !== null ? { ...payload.meta } : {};

  if (resolvedClass) {
    meta.class = resolvedClass;
  }

  return {
    studentId: payload.studentId || generateStudentId(),
    name: payload.name,
    email: payload.email,
    role: "student",
    password: payload.password,
    class: resolvedClass,
    section: payload.section || null,
    classId: payload.classId || null,
    sectionId: payload.sectionId || null,
    admissionNumber: payload.admissionNumber || null,
    rollNumber: payload.rollNumber || null,
    meta,
    createdAt: new Date(),
    refreshToken: null,
  };
};

const createStudent = async (payload) => {
  const db = getDB();
  const student = normalizeStudentPayload(payload);
  const result = await db.collection("users").insertOne(student);
  return db.collection("users").findOne({ _id: result.insertedId });
};

const createUser = async (payload) => {
  const db = getDB();
  const resolvedClass = payload.class ?? payload.meta?.class ?? null;
  const meta = typeof payload.meta === "object" && payload.meta !== null ? { ...payload.meta } : {};

  if (resolvedClass) {
    meta.class = resolvedClass;
  }

  const user = {
    name: payload.name,
    email: payload.email,
    password: payload.password,
    role: payload.role || "student",
    class: resolvedClass,
    section: payload.section || null,
    classId: payload.classId || null,
    sectionId: payload.sectionId || null,
    admissionNumber: payload.admissionNumber || null,
    rollNumber: payload.rollNumber || null,
    studentId: payload.studentId || (payload.role === "student" ? generateStudentId() : null),
    meta,
    createdAt: new Date(),
    refreshToken: null,
  };
  const result = await db.collection("users").insertOne(user);
  return db.collection("users").findOne({ _id: result.insertedId });
};

const updateUserRefreshToken = async (identifier, token, options = {}) => {
  const db = getDB();
  const filter = options.lookupRefreshToken
    ? { refreshToken: identifier }
    : ObjectId.isValid(identifier)
      ? { _id: new ObjectId(identifier) }
      : { email: identifier };

  await db.collection("users").updateOne(filter, {
    $set: { refreshToken: token },
  });
};

const findUserByRefreshToken = async (refreshToken) => {
  if (!refreshToken) return null;
  const db = getDB();
  return db.collection("users").findOne({ refreshToken });
};

const updateStudent = async (id, updates) => {
  if (!ObjectId.isValid(id)) return null;
  const allowedFields = {
    studentId: updates.studentId,
    name: updates.name,
    email: updates.email,
    password: updates.password,
    class: updates.class,
    section: updates.section,
    classId: updates.classId,
    sectionId: updates.sectionId,
    admissionNumber: updates.admissionNumber,
    rollNumber: updates.rollNumber,
    meta: updates.meta,
  };

  const set = {};
  Object.entries(allowedFields).forEach(([key, value]) => {
    if (typeof value !== "undefined") {
      set[key] = value;
    }
  });

  if (Object.keys(set).length === 0) {
    return null;
  }

  const db = getDB();
  await db.collection("users").updateOne(
    { _id: new ObjectId(id), role: "student" },
    { $set: set },
  );

  return findStudentById(id);
};

const deleteStudent = async (id) => {
  if (!ObjectId.isValid(id)) return false;
  const db = getDB();
  const result = await db.collection("users").deleteOne({
    _id: new ObjectId(id),
    role: "student",
  });
  return result.deletedCount > 0;
};

const resolveStudentObjectId = async (identifier) => {
  if (!identifier) return null;

  const db = getDB();
  if (ObjectId.isValid(identifier)) {
    const student = await db.collection("users").findOne({
      _id: new ObjectId(identifier),
      role: "student",
    });
    if (student) {
      return student._id;
    }
  }

  const student = await db.collection("users").findOne({
    studentId: identifier,
    role: "student",
  });

  return student ? student._id : null;
};

module.exports = {
  toPublicUser,
  findStudents,
  findStudentById,
  findStudentByEmail,
  findUserByEmail,
  findUserByRefreshToken,
  findUserById,
  createStudent,
  createUser,
  updateUserRefreshToken,
  updateStudent,
  deleteStudent,
  resolveStudentObjectId,
};
