require('dotenv').config({ path: './server/.env' });

const bcrypt = require('bcryptjs');
const { MongoClient, ObjectId } = require('mongodb');

const uri = process.env.MONGO_URI;
const dbName = process.env.MONGO_DB_NAME || 'campushub';

const gradeLabels = ['Nursery', ...Array.from({ length: 12 }, (_, index) => `Class ${index + 1}`)];
const sections = ['A', 'B', 'C', 'D'];
const timeSlots = ['08:30', '10:00', '11:30', '13:30'];
const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

const subjectMap = {
  Nursery: ['Nursery Rhymes', 'Story Time', 'Art & Craft', 'Play & Discovery'],
  'Class 1': ['English', 'Mathematics', 'Science', 'Social Studies'],
  'Class 2': ['English', 'Mathematics', 'Science', 'Social Studies'],
  'Class 3': ['English', 'Mathematics', 'Science', 'Computer Skills'],
  'Class 4': ['English', 'Mathematics', 'Science', 'Computer Skills'],
  'Class 5': ['English', 'Mathematics', 'Science', 'Social Studies'],
  'Class 6': ['English', 'Mathematics', 'Physics', 'Social Studies'],
  'Class 7': ['English', 'Mathematics', 'Physics', 'Social Studies'],
  'Class 8': ['English', 'Mathematics', 'Physics', 'Social Studies'],
  'Class 9': ['English', 'Mathematics', 'Physics', 'Chemistry'],
  'Class 10': ['English', 'Mathematics', 'Physics', 'Chemistry'],
  'Class 11': ['English', 'Mathematics', 'Physics', 'Chemistry'],
  'Class 12': ['English', 'Mathematics', 'Physics', 'Chemistry'],
};

const teacherNames = [
  'Amina Rahman',
  'Sanjay Verma',
  'Farah Khan',
  'Rohan Mehta',
  'Nidhi Sharma',
  'Arjun Patel',
  'Leena George',
  'Anil Kapoor',
  'Maya Iyer',
  'Harsh Deep',
  'Priya Nair',
  'Karan Ahuja',
  'Sofia Khan',
  'Ibrahim Haleem',
  'Ritika Mehra',
  'Vikram Nanda',
  'Pallavi Bose',
  'Tariq Siddiqui',
  'Divya Raman',
  'Yash Gupta',
  'Anita Choudhary',
  'Kunal Jha',
  'Sneha Reddy',
  'Aditya Sen',
  'Charu Malik',
  'Imran Yousuf',
  'Deepa Thomas',
  'Neelam Singh',
  'Fahad Abbas',
  'Madhur Rao',
];

const teacherSubjects = [
  'Nursery Education',
  'Mathematics',
  'English',
  'Science',
  'Social Studies',
  'Physics',
  'Chemistry',
  'Biology',
  'Computer Skills',
  'Art',
  'Music',
  'Physical Education',
  'Language Lab',
  'Sports',
  'History',
  'Geography',
  'Literature',
  'Robotics',
  'Civics',
  'Mathematics',
  'English',
  'Science',
  'Social Studies',
  'Physics',
  'Chemistry',
  'Biology',
  'Computer Skills',
  'Special Education',
  'Counselling',
  'Economics',
];

const firstNames = [
  'Aarav', 'Aanya', 'Ishaan', 'Diya', 'Arjun', 'Anya', 'Kabir', 'Saanvi', 'Rohan', 'Naira',
  'Aditya', 'Kavya', 'Vihaan', 'Sia', 'Aryan', 'Mira', 'Ethan', 'Aadhya', 'Krish', 'Riya',
  'Ira', 'Yash', 'Aarushi', 'Kiaan', 'Anya', 'Mohan', 'Pihu', 'Parth', 'Nia', 'Veer',
  'Sara', 'Mihir', 'Zara', 'Kian', 'Anvi', 'Arnav', 'Rhea', 'Arya', 'Ayaan', 'Manya',
  'Noah', 'Sana', 'Kairav', 'Ariya', 'Dhruv', 'Tara', 'Nishan', 'Alia', 'Tejas', 'Ritika',
  'Jai', 'Anya', 'Sahil', 'Shreya', 'Yuvan', 'Nehar', 'Aara', 'Amit', 'Ishani', 'Kiaan',
  'Jatin', 'Sia', 'Raunak', 'Anya', 'Harsh', 'Misha', 'Rishabh', 'Soham', 'Alyssa', 'Tanvi',
  'Rudra', 'Kavya', 'Kush', 'Naina', 'Abir', 'Veda', 'Pari', 'Yuvraj', 'Eshaan', 'Dhyani',
  'Kunal', 'Mahi', 'Mrv', 'Anya', 'Zayan', 'Lavanya', 'Dharam', 'Shruti', 'Aarohi', 'Manan',
  'Daanish', 'Marin', 'Yug', 'Pallavi', 'Riaan', 'Asha', 'Karthik', 'Tanisha', 'Eshita', 'Rohan',
];

const lastNames = [
  'Sharma', 'Verma', 'Iyer', 'Nair', 'Menon', 'Patel', 'Khan', 'Kapoor', 'Rao', 'Agarwal',
  'Bose', 'Chopra', 'Gupta', 'Reddy', 'Saxena', 'Thomas', 'Joseph', 'Singh', 'Mishra', 'Dutta',
  'Mitra', 'Das', 'Malhotra', 'Choudhury', 'Saluja', 'Sinha', 'Roy', 'Hegde', 'Bhatia', 'Jain',
];

function getName(index) {
  const first = firstNames[index % firstNames.length];
  const last = lastNames[Math.floor(index / 3) % lastNames.length];
  return `${first} ${last}`;
}

function classLabel(grade, section) {
  if (grade === 'Nursery') {
    return `${grade} ${section}`;
  }
  return `${grade} ${section}`;
}

function roomFor(gradeIndex, sectionIndex) {
  const prefix = gradeIndex < 4 ? 'N' : gradeIndex < 8 ? 'L' : gradeIndex < 12 ? 'M' : 'H';
  return `${prefix}-${String(sectionIndex + 1).padStart(2, '0')}`;
}

async function seedSchoolPlan() {
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db(dbName);

  const adminUser = await db.collection('users').findOne({ email: 'admin@educore.school' });
  const adminId = adminUser?._id || null;

  await db.collection('users').deleteMany({ role: { $in: ['teacher', 'student'] } });
  await db.collection('attendance').deleteMany({});
  await db.collection('timetable').deleteMany({});
  await db.collection('classes').deleteMany({});
  await db.collection('students').deleteMany({});

  const teacherDocs = [];
  const classTeacherMap = new Map();

  for (let index = 0; index < teacherNames.length; index += 1) {
    const name = teacherNames[index];
    const subject = teacherSubjects[index];
    const classes = [];

    if (index < gradeLabels.length) {
      classes.push(...sections.map((section) => classLabel(gradeLabels[index], section)));
    } else if (index === 14) {
      classes.push(...sections.map((section) => classLabel('Nursery', section)));
      classes.push(...sections.map((section) => classLabel('Class 1', section)));
    } else if (index === 15) {
      classes.push(...sections.map((section) => classLabel('Class 2', section)));
      classes.push(...sections.map((section) => classLabel('Class 3', section)));
    } else if (index === 16) {
      classes.push(...sections.map((section) => classLabel('Class 4', section)));
      classes.push(...sections.map((section) => classLabel('Class 5', section)));
    } else if (index === 17) {
      classes.push(...sections.map((section) => classLabel('Class 6', section)));
      classes.push(...sections.map((section) => classLabel('Class 7', section)));
    } else if (index === 18) {
      classes.push(...sections.map((section) => classLabel('Class 8', section)));
      classes.push(...sections.map((section) => classLabel('Class 9', section)));
    } else if (index === 19) {
      classes.push(...sections.map((section) => classLabel('Class 10', section)));
      classes.push(...sections.map((section) => classLabel('Class 11', section)));
    } else if (index === 20) {
      classes.push(...sections.map((section) => classLabel('Class 12', section)));
      classes.push(...sections.map((section) => classLabel('Nursery', section)));
    } else if (index === 21) {
      classes.push(...sections.map((section) => classLabel('Class 1', section)));
      classes.push(...sections.map((section) => classLabel('Class 2', section)));
    } else if (index === 22) {
      classes.push(...sections.map((section) => classLabel('Class 3', section)));
      classes.push(...sections.map((section) => classLabel('Class 4', section)));
    } else if (index === 23) {
      classes.push(...sections.map((section) => classLabel('Class 5', section)));
      classes.push(...sections.map((section) => classLabel('Class 6', section)));
    } else if (index === 24) {
      classes.push(...sections.map((section) => classLabel('Class 7', section)));
      classes.push(...sections.map((section) => classLabel('Class 8', section)));
    } else if (index === 25) {
      classes.push(...sections.map((section) => classLabel('Class 9', section)));
      classes.push(...sections.map((section) => classLabel('Class 10', section)));
    } else if (index === 26) {
      classes.push(...sections.map((section) => classLabel('Class 11', section)));
      classes.push(...sections.map((section) => classLabel('Class 12', section)));
    } else if (index === 27) {
      classes.push(...sections.map((section) => classLabel('Nursery', section)));
      classes.push(...sections.map((section) => classLabel('Class 1', section)));
    } else if (index === 28) {
      classes.push(...sections.map((section) => classLabel('Class 2', section)));
      classes.push(...sections.map((section) => classLabel('Class 3', section)));
    } else if (index === 29) {
      classes.push(...sections.map((section) => classLabel('Class 4', section)));
      classes.push(...sections.map((section) => classLabel('Class 5', section)));
    }

    const teacherDoc = {
      name,
      email: `teacher${String(index + 1).padStart(2, '0')}@educore.school`,
      password: await bcrypt.hash('Teacher@123', 10),
      role: 'teacher',
      meta: {
        subject,
        classes: classes.join(', '),
        department: 'Academics',
      },
      createdAt: new Date(),
      refreshToken: null,
    };

    teacherDocs.push(teacherDoc);
    for (const className of classes) {
      if (!classTeacherMap.has(className)) {
        classTeacherMap.set(className, teacherDoc.email);
      }
    }
  }

  const insertedTeachers = await db.collection('users').insertMany(teacherDocs);
  const teacherIds = Object.values(insertedTeachers.insertedIds);

  const classDocs = [];
  const teacherEmailToId = new Map();

  teacherDocs.forEach((doc, index) => {
    teacherEmailToId.set(doc.email, teacherIds[index]);
  });

  for (const [classLabelValue, teacherEmail] of classTeacherMap.entries()) {
    const grade = classLabelValue.split(' ')[0] === 'Nursery' ? 'Nursery' : classLabelValue.split(' ')[0];
    const section = classLabelValue.split(' ').slice(-1)[0];
    classDocs.push({
      name: grade,
      section,
      description: classLabelValue,
      teacherId: teacherEmailToId.get(teacherEmail),
      createdAt: new Date(),
    });
  }

  await db.collection('classes').insertMany(classDocs);

  const studentDocs = [];
  const studentCollectionDocs = [];
  let counter = 1;

  for (const grade of gradeLabels) {
    for (const section of sections) {
      const className = classLabel(grade, section);
      const teacherEmail = classTeacherMap.get(className) || teacherDocs[0].email;
      const assignedTeacher = teacherDocs.find((teacher) => teacher.email === teacherEmail);

      for (let studentIndex = 0; studentIndex < 2; studentIndex += 1) {
        const studentName = getName(counter + studentIndex * 17 + gradeLabels.indexOf(grade));
        const studentId = `S-2026-${String(counter).padStart(3, '0')}`;
        const email = `student${String(counter).padStart(3, '0')}@educore.school`;

        const studentDoc = {
          name: studentName,
          email,
          password: await bcrypt.hash('Student@123', 10),
          role: 'student',
          studentId,
          class: className,
          section,
          meta: {
            class: className,
            section,
            assignedTeacher: assignedTeacher?.name || 'Unassigned',
            rollNumber: String(studentIndex + 1).padStart(2, '0'),
          },
          createdAt: new Date(),
          refreshToken: null,
        };

        studentDocs.push(studentDoc);
        studentCollectionDocs.push({
          id: studentId,
          studentId,
          name: studentName,
          email,
          role: 'student',
          status: 'active',
          meta: {
            class: className,
            section,
            assignedTeacher: assignedTeacher?.name || 'Unassigned',
            rollNumber: String(studentIndex + 1).padStart(2, '0'),
          },
          enrolledAt: new Date().toLocaleDateString(),
        });
        counter += 1;
      }
    }
  }

  await db.collection('users').insertMany(studentDocs);
  await db.collection('students').insertMany(studentCollectionDocs);

  const insertedStudents = await db.collection('users')
    .find({ email: { $in: studentDocs.map((student) => student.email) } })
    .toArray();

  const timetableDocs = [];
  const attendanceDocs = [];
  const attendanceDate = new Date();
  attendanceDate.setUTCDate(attendanceDate.getUTCDate() - 1);
  attendanceDate.setUTCHours(0, 0, 0, 0);

  for (const grade of gradeLabels) {
    for (const section of sections) {
      const className = classLabel(grade, section);
      const teacherEmail = classTeacherMap.get(className) || teacherDocs[0].email;
      const teacherDoc = teacherDocs.find((entry) => entry.email === teacherEmail);
      const subjects = subjectMap[grade] || ['English', 'Mathematics', 'Science', 'Social Studies'];
      const room = roomFor(gradeLabels.indexOf(grade), sections.indexOf(section));

      weekdays.forEach((day) => {
        timeSlots.forEach((time, slotIndex) => {
          timetableDocs.push({
            day,
            time,
            subject: subjects[slotIndex % subjects.length],
            room,
            teacher: teacherDoc?.name || 'TBD',
            grade: className,
          });
        });
      });
    }
  }

  insertedStudents.forEach((student, index) => {
    const status = index % 8 === 0 ? 'late' : index % 11 === 0 ? 'absent' : 'present';

    attendanceDocs.push({
      studentId: student._id,
      courseId: null,
      classId: null,
      sectionId: null,
      grade: student.class,
      date: attendanceDate,
      status,
      notes: status === 'absent' ? 'Auto-seeded attendance' : '',
      createdBy: adminId?.toString() || 'system',
      createdAt: new Date(),
    });
  });

  await db.collection('timetable').insertMany(timetableDocs);
  await db.collection('attendance').insertMany(attendanceDocs);

  console.log(JSON.stringify({
    teachers: teacherDocs.length,
    students: studentDocs.length,
    classes: classDocs.length,
    timetableEntries: timetableDocs.length,
    attendanceRecords: attendanceDocs.length,
  }, null, 2));

  await client.close();
}

seedSchoolPlan().catch((error) => {
  console.error(error);
  process.exit(1);
});
