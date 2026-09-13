const { pool } = require('../config/db');

async function logAudit(connection, { ticketId, changedBy, field, oldValue, newValue }) {
  const conn = connection || pool;
  await conn.query(
    `INSERT INTO audit_logs (ticket_id, changed_by, field_changed, old_value, new_value)
     VALUES (?, ?, ?, ?, ?)`,
    [ticketId, changedBy, field, oldValue !== undefined ? String(oldValue) : null, String(newValue)]
  );
}

async function getAuditLogsForTicket(ticketId) {
  const [rows] = await pool.query(
    `SELECT a.*, u.name AS changed_by_name
     FROM audit_logs a
     LEFT JOIN users u ON a.changed_by = u.id
     WHERE a.ticket_id = ?
     ORDER BY a.changed_at DESC`,
    [ticketId]
  );
  return rows;
}

module.exports = { logAudit, getAuditLogsForTicket };
