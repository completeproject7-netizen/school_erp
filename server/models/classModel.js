const { ObjectId } = require("mongodb");
const { getDB } = require("../config/db");

const sanitizeClass = (klass) => ({
  id: klass._id.toString(),
  name: klass.name,
  section: klass.section,
  description: klass.description || null,
  teacherId: klass.teacherId ? klass.teacherId.toString() : null,
  createdAt: klass.createdAt,
});

const findClasses = async (filter = {}) => {
  const db = getDB();
  const query = {};
  if (filter.name) query.name = filter.name;
  if (filter.section) query.section = filter.section;
  if (filter.teacherId && ObjectId.isValid(filter.teacherId)) {
    query.teacherId = new ObjectId(filter.teacherId);
  }
  return db.collection("classes").find(query).toArray();
};

const findClassById = async (id) => {
  if (!ObjectId.isValid(id)) return null;
  const db = getDB();
  return db.collection("classes").findOne({ _id: new ObjectId(id) });
};

const createClass = async (payload) => {
  const db = getDB();
  const klass = {
    name: payload.name,
    section: payload.section,
    description: payload.description || null,
    teacherId: payload.teacherId && ObjectId.isValid(payload.teacherId) ? new ObjectId(payload.teacherId) : null,
    createdAt: new Date(),
  };
  const result = await db.collection("classes").insertOne(klass);
  return findClassById(result.insertedId);
};

const updateClass = async (id, updates) => {
  if (!ObjectId.isValid(id)) return null;
  const set = {};
  if (typeof updates.name !== "undefined") set.name = updates.name;
  if (typeof updates.section !== "undefined") set.section = updates.section;
  if (typeof updates.description !== "undefined") set.description = updates.description;
  if (typeof updates.teacherId !== "undefined") {
    set.teacherId = ObjectId.isValid(updates.teacherId) ? new ObjectId(updates.teacherId) : null;
  }

  if (Object.keys(set).length === 0) return null;

  const db = getDB();
  await db.collection("classes").updateOne({ _id: new ObjectId(id) }, { $set: set });
  return findClassById(id);
};

const deleteClass = async (id) => {
  if (!ObjectId.isValid(id)) return false;
  const db = getDB();
  const result = await db.collection("classes").deleteOne({ _id: new ObjectId(id) });
  return result.deletedCount > 0;
};

module.exports = {
  sanitizeClass,
  findClasses,
  findClassById,
  createClass,
  updateClass,
  deleteClass,
};
