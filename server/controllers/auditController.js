const { getDB } = require("../config/db");

const listAuditLogs = async (req, res) => {
  const db = getDB();
  const { collectionName, action, performedBy } = req.query;
  const query = {};
  if (collectionName) query.collectionName = collectionName;
  if (action) query.action = action;
  if (performedBy) query.performedBy = performedBy;

  const logs = await db
    .collection("audit_logs")
    .find(query)
    .sort({ createdAt: -1 })
    .limit(200)
    .toArray();

  return res.json({ audit: logs });
};

module.exports = {
  listAuditLogs,
};
