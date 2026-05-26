const dns = require("dns");
const { MongoClient } = require("mongodb");

if (process.env.MONGO_URI?.startsWith("mongodb+srv://")) {
  dns.setServers(["8.8.8.8", "1.1.1.1"]);
}

const uri = process.env.MONGO_URI;
const defaultDbName = process.env.MONGO_DB_NAME || "campushub";

if (!uri) {
  throw new Error("MONGO_URI is required. Set it in server/.env or the environment.");
}

const client = new MongoClient(uri);

let db;

const connectDB = async () => {
  try {
    await client.connect();

    db = client.db(defaultDbName);

    console.log("MongoDB Connected");
    await setupIndexes();
  } catch (error) {
    console.error("Failed to connect to MongoDB:", error);
    throw error;
  }
};

const getDB = () => db;

const getCollection = (name) => {
  if (!db) {
    throw new Error("MongoDB not initialized. Call connectDB first.");
  }
  return db.collection(name);
};

const setupIndexes = async () => {
  if (!db) return;

  await db.collection("users").createIndex({ email: 1 }, { unique: true, sparse: true });
  await db.collection("attendance").createIndex({ grade: 1, date: 1 });
  await db.collection("attendance").createIndex({ studentId: 1 });
  await db.collection("attendance").createIndex({ classId: 1 });
  await db.collection("attendance").createIndex({ sectionId: 1 });
  await db.collection("courses").createIndex({ grade: 1, section: 1 });
  await db.collection("courses").createIndex({ classId: 1 });
  await db.collection("courses").createIndex({ sectionId: 1 });
  await db.collection("courses").createIndex({ teacherId: 1 });
  await db.collection("fees").createIndex({ studentId: 1 });
  await db.collection("audit_logs").createIndex({ createdAt: 1 });
};

module.exports = {
  connectDB,
  getDB,
  getCollection,
};