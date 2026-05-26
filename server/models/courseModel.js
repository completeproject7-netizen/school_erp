const { ObjectId } = require("mongodb");
const { getDB } = require("../config/db");

const sanitizeCourse = (course) => ({
  id: course._id.toString(),
  title: course.title,
  description: course.description,
  grade: course.grade,
  section: course.section || null,
  classId: course.classId ? course.classId.toString() : null,
  sectionId: course.sectionId ? course.sectionId.toString() : null,
  teacherId: course.teacherId ? course.teacherId.toString() : null,
  teacherName: course.teacherName || null,
  credits: course.credits || 0,
  day: course.day || null,
  time: course.time || null,
  room: course.room || null,
  createdAt: course.createdAt,
});

const findCourses = async (filter = {}) => {
  const db = getDB();
  const query = {};
  if (filter.grade) query.grade = filter.grade;
  if (filter.section) query.section = filter.section;
  if (filter.classId && ObjectId.isValid(filter.classId)) {
    query.classId = new ObjectId(filter.classId);
  }
  if (filter.sectionId && ObjectId.isValid(filter.sectionId)) {
    query.sectionId = new ObjectId(filter.sectionId);
  }
  if (filter.teacherId && ObjectId.isValid(filter.teacherId)) {
    query.teacherId = new ObjectId(filter.teacherId);
  }
  return db.collection("courses").find(query).toArray();
};

const findCourseById = async (id) => {
  if (!ObjectId.isValid(id)) return null;
  const db = getDB();
  return db.collection("courses").findOne({ _id: new ObjectId(id) });
};

const createCourse = async (payload) => {
  const db = getDB();
  const course = {
    title: payload.title,
    description: payload.description,
    grade: payload.grade,
    section: payload.section || null,
    classId: payload.classId && ObjectId.isValid(payload.classId) ? new ObjectId(payload.classId) : null,
    sectionId: payload.sectionId && ObjectId.isValid(payload.sectionId) ? new ObjectId(payload.sectionId) : null,
    teacherId: payload.teacherId && ObjectId.isValid(payload.teacherId) ? new ObjectId(payload.teacherId) : null,
    teacherName: payload.teacherName || null,
    credits: payload.credits || 3,
    day: payload.day || null,
    time: payload.time || null,
    room: payload.room || null,
    createdAt: new Date(),
  };
  const result = await db.collection("courses").insertOne(course);
  return findCourseById(result.insertedId);
};

const updateCourse = async (id, updates) => {
  if (!ObjectId.isValid(id)) return null;
  const set = {};
  if (typeof updates.title !== "undefined") set.title = updates.title;
  if (typeof updates.description !== "undefined") set.description = updates.description;
  if (typeof updates.grade !== "undefined") set.grade = updates.grade;
  if (typeof updates.section !== "undefined") set.section = updates.section;
  if (typeof updates.classId !== "undefined") {
    set.classId = ObjectId.isValid(updates.classId) ? new ObjectId(updates.classId) : null;
  }
  if (typeof updates.sectionId !== "undefined") {
    set.sectionId = ObjectId.isValid(updates.sectionId) ? new ObjectId(updates.sectionId) : null;
  }
  if (typeof updates.teacherName !== "undefined") set.teacherName = updates.teacherName;
  if (typeof updates.credits !== "undefined") set.credits = updates.credits;
  if (typeof updates.day !== "undefined") set.day = updates.day;
  if (typeof updates.time !== "undefined") set.time = updates.time;
  if (typeof updates.room !== "undefined") set.room = updates.room;
  if (typeof updates.teacherId !== "undefined") {
    set.teacherId = ObjectId.isValid(updates.teacherId) ? new ObjectId(updates.teacherId) : null;
  }

  if (Object.keys(set).length === 0) return null;

  const db = getDB();
  await db.collection("courses").updateOne({ _id: new ObjectId(id) }, { $set: set });
  return findCourseById(id);
};

const deleteCourse = async (id) => {
  if (!ObjectId.isValid(id)) return false;
  const db = getDB();
  const result = await db.collection("courses").deleteOne({ _id: new ObjectId(id) });
  return result.deletedCount > 0;
};

module.exports = {
  sanitizeCourse,
  findCourses,
  findCourseById,
  createCourse,
  updateCourse,
  deleteCourse,
};
