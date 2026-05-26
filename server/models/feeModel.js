const { ObjectId } = require("mongodb");
const { getDB } = require("../config/db");

const payFee = async (payload) => {
  const db = getDB();
  const fee = {
    studentId: new ObjectId(payload.studentId),
    amount: payload.amount,
    description: payload.description,
    paymentMethod: payload.paymentMethod || "online",
    paidAt: new Date(),
    createdBy: payload.createdBy,
    createdByName: payload.createdByName || null,
    createdAt: new Date(),
  };

  const result = await db.collection("fees").insertOne(fee);
  return db.collection("fees").findOne({ _id: result.insertedId });
};

const buildFeeQuery = (filter = {}) => {
  const query = {};
  if (filter.studentId && ObjectId.isValid(filter.studentId)) {
    query.studentId = new ObjectId(filter.studentId);
  }
  return query;
};

const findFees = async (filter = {}) => {
  const db = getDB();
  return db.collection("fees").find(buildFeeQuery(filter)).toArray();
};

const findFeeById = async (id) => {
  if (!ObjectId.isValid(id)) return null;
  const db = getDB();
  return db.collection("fees").findOne({ _id: new ObjectId(id) });
};

const updateFee = async (id, updates) => {
  if (!ObjectId.isValid(id)) return null;
  const set = {};

  if (typeof updates.amount !== "undefined") {
    set.amount = updates.amount;
  }
  if (typeof updates.description !== "undefined") {
    set.description = updates.description;
  }
  if (typeof updates.paymentMethod !== "undefined") {
    set.paymentMethod = updates.paymentMethod;
  }
  if (typeof updates.studentId !== "undefined") {
    if (!ObjectId.isValid(updates.studentId)) {
      throw new Error("Invalid studentId");
    }
    set.studentId = new ObjectId(updates.studentId);
  }

  if (Object.keys(set).length === 0) {
    return null;
  }

  const db = getDB();
  await db.collection("fees").updateOne(
    { _id: new ObjectId(id) },
    { $set: set },
  );

  return findFeeById(id);
};

const deleteFee = async (id) => {
  if (!ObjectId.isValid(id)) return false;
  const db = getDB();
  const result = await db.collection("fees").deleteOne({ _id: new ObjectId(id) });
  return result.deletedCount > 0;
};

module.exports = {
  payFee,
  findFees,
  findFeeById,
  updateFee,
  deleteFee,
};
