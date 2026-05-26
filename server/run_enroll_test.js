require('dotenv').config();
const { MongoClient } = require('mongodb');
(async () => {
  const [,, enrollmentId, email, parentMobile] = process.argv;
  if (!enrollmentId || !email || !parentMobile) {
    console.error('Usage: node run_enroll_test.js <enrollmentId> <email> <parentMobile>');
    process.exit(1);
  }
  const uri = process.env.MONGO_URI;
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const dbName = process.env.MONGO_DB_NAME || 'campushub';
    const db = client.db(dbName);
    const enrollment = await db.collection('enrollments').findOne({ id: enrollmentId });
    if (!enrollment) { console.error('Enrollment not found'); process.exit(1); }
    const studentId = enrollment.studentId || `STU-${new Date().getFullYear()}-${String(Date.now() % 1000).padStart(3,'0')}`;
    const student = {
      id: studentId,
      studentId,
      name: enrollment.applicant,
      email,
      parentMobile,
      role: 'student',
      status: 'active',
      meta: { class: enrollment.appliedFor },
      enrolledAt: new Date().toLocaleDateString(),
    };
    await db.collection('students').updateOne({ id: studentId }, { $set: student }, { upsert: true });
    await db.collection('users').updateOne({ id: studentId }, { $set: { id: studentId, name: enrollment.applicant, email, role: 'student', parentMobile, createdAt: new Date() } }, { upsert: true });
    await db.collection('enrollments').updateOne({ id: enrollment.id }, { $set: { enrollmentStatus: 'Enrolled', enrolledAt: new Date().toLocaleDateString(), studentId, email, parentMobile } });
    // compute analytics with same broad staff roles
    const totalStudents = await db.collection('users').countDocuments({ role: 'student' });
    const totalTeachers = await db.collection('users').countDocuments({ role: 'teacher' });
    const totalStaff = await db.collection('users').countDocuments({ role: { $in: ['staff','administrator','admission'] } });
    const [feeStats] = await db.collection('fees').aggregate([{ $group: { _id: null, totalCollected: { $sum: '$amount' }, payments: { $sum: 1 } } }]).toArray();
    const totalCourses = await db.collection('courses').countDocuments();
    const studentTrend = await db.collection('users').aggregate([{ $match: { role: 'student' } }, { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } }, { $sort: { _id: 1 } }]).toArray();
    const analytics = { totals: { students: totalStudents, teachers: totalTeachers, staff: totalStaff, courses: totalCourses }, fees: { totalCollected: feeStats?.totalCollected || 0, totalPayments: feeStats?.payments || 0 }, studentTrend };
    console.log('Enrolled studentId:', studentId);
    console.log('Analytics snapshot:', JSON.stringify(analytics,null,2));
  } catch (e) { console.error(e); } finally { await client.close(); }
})();
