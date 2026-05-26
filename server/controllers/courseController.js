const { courseSchema, updateCourseSchema } = require("../validators/courseValidator");
const {
  createCourse,
  deleteCourse,
  findCourseById,
  findCourses,
  sanitizeCourse,
  updateCourse,
} = require("../models/courseModel");
const { logAuditEvent } = require("../middleware/auditLogger");

const listCourses = async (req, res) => {
  const { grade, section, classId, sectionId, teacherId } = req.query;
  const courses = await findCourses({ grade, section, classId, sectionId, teacherId });
  return res.json({ courses: courses.map(sanitizeCourse) });
};

const getCourse = async (req, res) => {
  const course = await findCourseById(req.params.id);
  if (!course) {
    return res.status(404).json({ message: "Course not found" });
  }
  return res.json({ course: sanitizeCourse(course) });
};

const createCourseHandler = async (req, res) => {
  const payload = courseSchema.parse(req.body);
  const course = await createCourse(payload);

  await logAuditEvent({
    action: "create",
    collectionName: "courses",
    documentId: course._id.toString(),
    performedBy: req.user.id,
    userRole: req.user.role,
    details: {
      grade: course.grade,
      classId: course.classId,
      sectionId: course.sectionId,
      title: course.title,
    },
  });

  return res.status(201).json({ course: sanitizeCourse(course) });
};

const updateCourseHandler = async (req, res) => {
  const payload = updateCourseSchema.parse(req.body);
  const course = await updateCourse(req.params.id, payload);
  if (!course) {
    return res.status(404).json({ message: "Course not found or no updates provided" });
  }

  await logAuditEvent({
    action: "update",
    collectionName: "courses",
    documentId: course._id.toString(),
    performedBy: req.user.id,
    userRole: req.user.role,
    details: { updatedFields: Object.keys(payload) },
  });

  return res.json({ course: sanitizeCourse(course) });
};

const deleteCourseHandler = async (req, res) => {
  const removed = await deleteCourse(req.params.id);
  if (!removed) {
    return res.status(404).json({ message: "Course not found" });
  }

  await logAuditEvent({
    action: "delete",
    collectionName: "courses",
    documentId: req.params.id,
    performedBy: req.user.id,
    userRole: req.user.role,
  });

  return res.json({ message: "Course deleted" });
};

module.exports = {
  listCourses,
  getCourse,
  createCourseHandler,
  updateCourseHandler,
  deleteCourseHandler,
};
