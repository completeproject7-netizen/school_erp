require('dotenv').config();
const { MongoClient } = require('mongodb');
(async () => {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error('MONGO_URI not set');
    process.exit(1);
  }
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const dbName = process.env.MONGO_DB_NAME || 'campushub';
    const db = client.db(dbName);
    console.log('DB:', dbName);
    const roles = await db.collection('users').aggregate([{ $group: { _id: '$role', count: { $sum: 1 } } }]).toArray();
    console.log('Users by role:', JSON.stringify(roles, null, 2));
    const studentsCount = await db.collection('students').countDocuments();
    console.log('students collection count:', studentsCount);
      const enrollments = await db.collection('enrollments').find().limit(10).toArray();
      console.log('sample enrollments:', enrollments.map(e => ({ id: e.id, applicant: e.applicant, stage: e.stage })).slice(0,10));
    const usersCount = await db.collection('users').countDocuments();
    console.log('users collection count:', usersCount);
    const teachersInUsers = await db.collection('users').countDocuments({ role: 'teacher' });
    console.log('users.role==teacher count:', teachersInUsers);
    const staffInUsers = await db.collection('users').countDocuments({ role: 'staff' });
    console.log('users.role==staff count:', staffInUsers);
    const hasStaffCollection = (await db.listCollections({ name: 'staff' }).toArray()).length > 0;
    console.log('has staff collection:', hasStaffCollection);
    if (hasStaffCollection) {
      console.log('staff collection count:', await db.collection('staff').countDocuments());
    }
  } catch (e) {
    console.error(e);
  } finally {
    await client.close();
  }
})();
