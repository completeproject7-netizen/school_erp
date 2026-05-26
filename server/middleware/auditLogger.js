const { getCollection } = require("../config/db");

const logAuditEvent = async ({
  action,
  collectionName,
  documentId,
  performedBy,
  userRole,
  details,
}) => {
  const auditCollection = getCollection("audit_logs");
  await auditCollection.insertOne({
    action,
    collectionName,
    documentId: documentId || null,
    performedBy,
    userRole,
    details: details || {},
    createdAt: new Date(),
  });
};

module.exports = {
  logAuditEvent,
};
