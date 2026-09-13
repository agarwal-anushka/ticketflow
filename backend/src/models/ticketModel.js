const { pool } = require('../config/db');

async function createTicket({ title, description, priority, createdBy }) {
  const [result] = await pool.query(
    'INSERT INTO tickets (title, description, priority, created_by) VALUES (?, ?, ?, ?)',
    [title, description, priority || 'medium', createdBy]
  );
  return getTicketById(result.insertId);
}

async function getTicketById(id) {
  const [rows] = await pool.query(
    `SELECT t.*, u.name AS assignee_name, c.name AS created_by_name
     FROM tickets t
     LEFT JOIN users u ON t.assignee_id = u.id
     LEFT JOIN users c ON t.created_by = c.id
     WHERE t.id = ?`,
    [id]
  );
  return rows[0] || null;
}

async function listTickets({ status, priority, assigneeId }) {
  let query = `
    SELECT t.*, u.name AS assignee_name
    FROM tickets t
    LEFT JOIN users u ON t.assignee_id = u.id
    WHERE 1=1
  `;
  const params = [];

  if (status) {
    query += ' AND t.status = ?';
    params.push(status);
  }
  if (priority) {
    query += ' AND t.priority = ?';
    params.push(priority);
  }
  if (assigneeId) {
    query += ' AND t.assignee_id = ?';
    params.push(assigneeId);
  }
  query += ' ORDER BY t.created_at DESC';

  const [rows] = await pool.query(query, params);
  return rows;
}

async function updateTicketField(connection, ticketId, field, value) {
  const conn = connection || pool;
  const allowedFields = ['status', 'priority', 'assignee_id', 'title', 'description'];
  if (!allowedFields.includes(field)) {
    throw new Error(`Field ${field} is not updatable`);
  }
  await conn.query(`UPDATE tickets SET ${field} = ? WHERE id = ?`, [value, ticketId]);
}

async function deleteTicket(id) {
  await pool.query('DELETE FROM tickets WHERE id = ?', [id]);
}

async function getAnalyticsSummary() {
  const [statusCounts] = await pool.query(
    'SELECT status, COUNT(*) AS count FROM tickets GROUP BY status'
  );
  const [priorityCounts] = await pool.query(
    'SELECT priority, COUNT(*) AS count FROM tickets GROUP BY priority'
  );
  const [avgResolution] = await pool.query(`
    SELECT AVG(TIMESTAMPDIFF(HOUR, created_at, updated_at)) AS avg_hours
    FROM tickets WHERE status = 'resolved'
  `);
  return {
    byStatus: statusCounts,
    byPriority: priorityCounts,
    avgResolutionHours: avgResolution[0].avg_hours || 0,
  };
}

module.exports = {
  createTicket,
  getTicketById,
  listTickets,
  updateTicketField,
  deleteTicket,
  getAnalyticsSummary,
};
