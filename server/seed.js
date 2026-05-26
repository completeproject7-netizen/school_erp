require("dotenv").config();
const bcrypt = require("bcryptjs");
const { connectDB, getDB } = require("./config/db");
const { ANNOUNCEMENTS, INQUIRIES, DOCUMENTS, MESSAGES, TIMETABLE, EVENTS, APPLICATIONS, ENROLLMENTS, STUDENTS, BOOKS } = require("./data/portalData");

async function run() {
  await connectDB();
  const db = getDB();

  const hashedAdmin = await bcrypt.hash("admin123", 10);
  const hashedTeacher = await bcrypt.hash("teacher123", 10);
  const hashedStudent = await bcrypt.hash("student123", 10);
  const hashedAdmission = await bcrypt.hash("admit123", 10);
  const hashedStaff = await bcrypt.hash("staff123", 10);

  const users = [
    {
      name: "Super Admin",
      email: "admin@educore.school",
      password: hashedAdmin,
      role: "administrator",
      meta: { department: "IT" },
      refreshToken: null,
      createdAt: new Date(),
    },
    {
      name: "James Carter",
      email: "teacher@educore.school",
      password: hashedTeacher,
      role: "teacher",
      meta: { subject: "Mathematics", classes: "Grade 9A, Grade 10A" },
      refreshToken: null,
      createdAt: new Date(),
    },
    {
      name: "Emma Wilson",
      email: "student@educore.school",
      password: hashedStudent,
      role: "student",
      studentId: "2026-S-104",
      meta: { class: "Grade 10A", roll: "2026-S-104" },
      refreshToken: null,
      createdAt: new Date(),
    },
    {
      name: "Priya Sharma",
      email: "admissions@educore.school",
      password: hashedAdmission,
      role: "admission",
      meta: { desk: "Admissions" },
      refreshToken: null,
      createdAt: new Date(),
    },
    {
      name: "Robert Lee",
      email: "staff@educore.school",
      password: hashedStaff,
      role: "staff",
      meta: { dept: "Library" },
      refreshToken: null,
      createdAt: new Date(),
    },
  ];

  const existingUsers = await db
    .collection("users")
    .find({ email: { $in: users.map((user) => user.email) } })
    .toArray();

  const existingEmails = new Set(existingUsers.map((user) => user.email));
  const missingUsers = users.filter((user) => !existingEmails.has(user.email));

  if (missingUsers.length > 0) {
    const result = await db.collection("users").insertMany(missingUsers);
    console.log(`Seeded ${result.insertedCount} users.`);
  } else {
    console.log("All dummy users already exist.");
  }

  const announcementCount = await db.collection("announcements").countDocuments();
  if (announcementCount === 0) {
    await db.collection("announcements").insertMany(ANNOUNCEMENTS);
    console.log(`Seeded ${ANNOUNCEMENTS.length} announcements.`);
  } else {
    console.log("Announcements already seeded.");
  }

  const eventCount = await db.collection("events").countDocuments();
  if (eventCount === 0) {
    const seedEvents = EVENTS.map((event) => ({
      ...event,
      status: "approved",
      requestedByName: "System",
      approvedByName: "System",
      approvedAt: new Date().toLocaleDateString(),
      createdAt: new Date(),
    }));
    await db.collection("events").insertMany(seedEvents);
    console.log(`Seeded ${seedEvents.length} events.`);
  } else {
    console.log("Events already seeded.");
  }

  const messageCount = await db.collection("messages").countDocuments();
  if (messageCount === 0) {
    const messages = MESSAGES.map((message) => ({ ...message, replies: [] }));
    await db.collection("messages").insertMany(messages);
    console.log(`Seeded ${messages.length} messages.`);
  } else {
    console.log("Messages already seeded.");
  }

  const applicationsCount = await db.collection("applications").countDocuments();
  if (applicationsCount === 0) {
    await db.collection("applications").insertMany(APPLICATIONS);
    console.log(`Seeded ${APPLICATIONS.length} applications.`);
  } else {
    console.log("Applications already seeded.");
  }

  const documentsCount = await db.collection("documents").countDocuments();
  if (documentsCount === 0) {
    await db.collection("documents").insertMany(DOCUMENTS.map((document) => ({
      ...document,
      content: null,
    })));
    console.log(`Seeded ${DOCUMENTS.length} documents.`);
  } else {
    console.log("Documents already seeded.");
  }

  const booksCount = await db.collection("books").countDocuments();
  if (booksCount === 0) {
    await db.collection("books").insertMany(BOOKS);
    console.log(`Seeded ${BOOKS.length} books.`);
  } else {
    console.log("Books already seeded.");
  }

  const inquiriesCount = await db.collection("inquiries").countDocuments();
  if (inquiriesCount === 0) {
    await db.collection("inquiries").insertMany(INQUIRIES);
    console.log(`Seeded ${INQUIRIES.length} inquiries.`);
  } else {
    console.log("Inquiries already seeded.");
  }

  const enrollmentsCount = await db.collection("enrollments").countDocuments();
  if (enrollmentsCount === 0) {
    if (ENROLLMENTS.length > 0) {
      await db.collection("enrollments").insertMany(ENROLLMENTS);
      console.log(`Seeded ${ENROLLMENTS.length} enrollments.`);
    }
  } else {
    console.log("Enrollments already seeded.");
  }

  const studentsCount = await db.collection("students").countDocuments();
  if (studentsCount === 0) {
    if (STUDENTS.length > 0) {
      await db.collection("students").insertMany(STUDENTS);
      console.log(`Seeded ${STUDENTS.length} students.`);
    }
  } else {
    console.log("Students already seeded.");
  }

  const timetableCount = await db.collection("timetable").countDocuments();
  if (timetableCount === 0) {
    if (TIMETABLE.length > 0) {
      await db.collection("timetable").insertMany(TIMETABLE);
      console.log(`Seeded ${TIMETABLE.length} timetable entries.`);
    }
  } else {
    const existingTimetable = await db.collection("timetable").find({}, { projection: { day: 1, time: 1, grade: 1, teacher: 1, subject: 1, room: 1 } }).toArray();
    const existingKeys = new Set(
      existingTimetable.map((item) => `${item.day}|${item.time}|${item.grade}|${item.teacher}`),
    );
    const missingEntries = TIMETABLE.filter(
      (item) => !existingKeys.has(`${item.day}|${item.time}|${item.grade}|${item.teacher}`),
    );
    if (missingEntries.length > 0) {
      await db.collection("timetable").insertMany(missingEntries);
      console.log(`Seeded ${missingEntries.length} missing timetable entries.`);
    } else {
      console.log("Timetable already seeded.");
    }
  }

  const gradebookCount = await db.collection("gradebook").countDocuments();
  if (gradebookCount === 0) {
    const gradebookEntries = [
      {
        id: "S-2026-104",
        studentEmail: "student@educore.school",
        name: "Emma Wilson",
        course: "Algebra I",
        teacher: "James Carter",
        grade: "A-",
        quiz1: 88,
        midterm: 76,
        project: 85,
        final: 92,
        percent: 85,
        gpa: 3.8,
        trend: "up",
      },
      {
        id: "S-2026-105",
        studentEmail: "liam.patel@educore.school",
        name: "Liam Patel",
        course: "Algebra I",
        teacher: "James Carter",
        grade: "B",
        quiz1: 74,
        midterm: 68,
        project: 79,
        final: 82,
        percent: 76,
        gpa: 3.1,
        trend: "flat",
      },
      {
        id: "S-2026-106",
        studentEmail: "sophia.garcia@educore.school",
        name: "Sophia Garcia",
        course: "Algebra I",
        teacher: "James Carter",
        grade: "A",
        quiz1: 92,
        midterm: 88,
        project: 91,
        final: 96,
        percent: 91,
        gpa: 3.9,
        trend: "up",
      },
      {
        id: "S-2026-107",
        studentEmail: "noah.kim@educore.school",
        name: "Noah Kim",
        course: "Algebra I",
        teacher: "James Carter",
        grade: "C",
        quiz1: 69,
        midterm: 72,
        project: 71,
        final: 74,
        percent: 72,
        gpa: 2.9,
        trend: "down",
      },
      {
        id: "S-2026-108",
        studentEmail: "olivia.brown@educore.school",
        name: "Olivia Brown",
        course: "Algebra I",
        teacher: "James Carter",
        grade: "B+",
        quiz1: 81,
        midterm: 78,
        project: 84,
        final: 88,
        percent: 83,
        gpa: 3.4,
        trend: "flat",
      },
    ];
    await db.collection("gradebook").insertMany(gradebookEntries);
    console.log(`Seeded ${gradebookEntries.length} gradebook entries.`);
  } else {
    console.log("Gradebook already seeded.");
  }

  process.exit(0);
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
