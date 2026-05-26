const { ObjectId } = require("mongodb");
const { getDB } = require("../config/db");

const buildAttendanceQuery = (query = {}) => {
  const filter = {};

  if (query.studentId && ObjectId.isValid(query.studentId)) {
    filter.studentId = new ObjectId(query.studentId);
  }

  if (query.courseId && ObjectId.isValid(query.courseId)) {
    filter.courseId = new ObjectId(query.courseId);
  }

  if (query.classId && ObjectId.isValid(query.classId)) {
    filter.classId = new ObjectId(query.classId);
  }

  if (query.sectionId && ObjectId.isValid(query.sectionId)) {
    filter.sectionId = new ObjectId(query.sectionId);
  }

  if (query.grade) {
    filter.grade = query.grade;
  }

  if (query.date) {
    const date = new Date(`${query.date}T00:00:00.000Z`);
    const end = new Date(date);
    end.setUTCDate(end.getUTCDate() + 1);
    filter.date = { $gte: date, $lt: end };
  }

  return filter;
};

const createAttendance = async (payload) => {
  const db = getDB();
  const attendance = {
    studentId: new ObjectId(payload.studentId),
    courseId:
      payload.courseId && ObjectId.isValid(payload.courseId)
        ? new ObjectId(payload.courseId)
        : null,
    classId:
      payload.classId && ObjectId.isValid(payload.classId)
        ? new ObjectId(payload.classId)
        : null,
    sectionId:
      payload.sectionId && ObjectId.isValid(payload.sectionId)
        ? new ObjectId(payload.sectionId)
        : null,
    grade: payload.grade || null,
    date: payload.date
      ? new Date(`${payload.date}T00:00:00.000Z`)
      : new Date(),
    status: payload.status,
    notes: payload.notes || "",
    createdBy: payload.createdBy,
    createdAt: new Date(),
  };

  const result = await db.collection("attendance").insertOne(attendance);
  return db.collection("attendance").findOne({ _id: result.insertedId });
};

const findAttendance = async (filter = {}) => {
  const db = getDB();
  return db.collection("attendance").find(buildAttendanceQuery(filter)).toArray();
};

const findAttendanceById = async (id) => {
  if (!ObjectId.isValid(id)) return null;
  const db = getDB();
  return db.collection("attendance").findOne({ _id: new ObjectId(id) });
};

const updateAttendance = async (id, updates) => {
  if (!ObjectId.isValid(id)) return null;
  const set = {};

  if (typeof updates.status !== "undefined") {
    set.status = updates.status;
  }
  if (typeof updates.notes !== "undefined") {
    set.notes = updates.notes;
  }
  if (typeof updates.grade !== "undefined") {
    set.grade = updates.grade || null;
  }
  if (typeof updates.courseId !== "undefined") {
    set.courseId = ObjectId.isValid(updates.courseId)
      ? new ObjectId(updates.courseId)
      : null;
  }
  if (typeof updates.classId !== "undefined") {
    set.classId = ObjectId.isValid(updates.classId)
      ? new ObjectId(updates.classId)
      : null;
  }
  if (typeof updates.sectionId !== "undefined") {
    set.sectionId = ObjectId.isValid(updates.sectionId)
      ? new ObjectId(updates.sectionId)
      : null;
  }
  if (typeof updates.studentId !== "undefined") {
    if (!ObjectId.isValid(updates.studentId)) {
      throw new Error("Invalid studentId");
    }
    set.studentId = new ObjectId(updates.studentId);
  }
  if (typeof updates.date !== "undefined") {
    set.date = updates.date
      ? new Date(`${updates.date}T00:00:00.000Z`)
      : new Date();
  }

  if (Object.keys(set).length === 0) {
    return null;
  }

  const db = getDB();
  await db.collection("attendance").updateOne(
    { _id: new ObjectId(id) },
    { $set: set },
  );

  return findAttendanceById(id);
};

const deleteAttendance = async (id) => {
  if (!ObjectId.isValid(id)) return false;
  const db = getDB();
  const result = await db.collection("attendance").deleteOne({ _id: new ObjectId(id) });
  return result.deletedCount > 0;
};

const attendanceExistsForGradeDate = async (grade, dateString, classId) => {
  if (!grade) return false;
  const db = getDB();
  const date = dateString
    ? new Date(`${dateString}T00:00:00.000Z`)
    : new Date();
  const end = new Date(date);
  end.setUTCDate(end.getUTCDate() + 1);
  const query = {
    grade,
    date: { $gte: date, $lt: end },
  };
  if (classId && ObjectId.isValid(classId)) {
    query.classId = new ObjectId(classId);
  }

  return (await db.collection("attendance").countDocuments(query)) > 0;
};

module.exports = {
  createAttendance,
  findAttendance,
  findAttendanceById,
  updateAttendance,
  deleteAttendance,
  attendanceExistsForGradeDate,
};
