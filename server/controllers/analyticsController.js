const { getDB } = require("../config/db");

const dashboard = async (req, res) => {
  const db = getDB();
  const totalStudents = await db.collection("users").countDocuments({ role: "student" });
  const totalTeachers = await db.collection("users").countDocuments({ role: "teacher" });
  // Count staff broadly: include users with roles that represent staff members
  const totalStaff = await db.collection("users").countDocuments({ role: { $in: ["staff", "administrator", "admission"] } });

  const [feeStats] = await db
    .collection("fees")
    .aggregate([
      { $group: { _id: null, totalCollected: { $sum: "$amount" }, payments: { $sum: 1 } } },
    ])
    .toArray();

  const totalCourses = await db.collection("courses").countDocuments();
  const totalAttendance = await db.collection("attendance").countDocuments();

  const studentTrend = await db
    .collection("users")
    .aggregate([
      { $match: { role: "student" } },
      { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ])
    .toArray();

  return res.json({
    totals: {
      students: totalStudents,
      teachers: totalTeachers,
      staff: totalStaff,
      courses: totalCourses,
      attendanceRecords: totalAttendance,
    },
    fees: {
      totalCollected: feeStats?.totalCollected || 0,
      totalPayments: feeStats?.payments || 0,
    },
    studentTrend,
  });
};

const attendanceSummary = async (req, res) => {
  const db = getDB();
  const summary = await db
    .collection("attendance")
    .aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } },
      { $project: { status: "$_id", count: 1, _id: 0 } },
    ])
    .toArray();

  const byGrade = await db
    .collection("attendance")
    .aggregate([
      { $group: { _id: { grade: "$grade", status: "$status" }, count: { $sum: 1 } } },
      { $group: { _id: "$_id.grade", statuses: { $push: { status: "$_id.status", count: "$count" } } } },
      { $project: { grade: "$_id", statuses: 1, _id: 0 } },
      { $sort: { grade: 1 } },
    ])
    .toArray();

  return res.json({ summary, byGrade });
};

const feeSummary = async (req, res) => {
  const db = getDB();
  const totalCollected = await db
    .collection("fees")
    .aggregate([{ $group: { _id: null, total: { $sum: "$amount" } } }])
    .toArray();

  const byStudent = await db
    .collection("fees")
    .aggregate([
      { $group: { _id: "$studentId", paidAmount: { $sum: "$amount" }, payments: { $sum: 1 } } },
      { $sort: { paidAmount: -1 } },
      { $limit: 20 },
    ])
    .toArray();

  return res.json({
    totalCollected: totalCollected[0]?.total || 0,
    topPayers: byStudent,
  });
};

module.exports = {
  dashboard,
  attendanceSummary,
  feeSummary,
};
