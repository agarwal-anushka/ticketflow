const { pool } = require('../config/db');

async function addComment({ ticketId, userId, message }) {
  const [result] = await pool.query(
    'INSERT INTO comments (ticket_id, user_id, message) VALUES (?, ?, ?)',
    [ticketId, userId, message]
  );
  const [rows] = await pool.query(
    `SELECT c.*, u.name AS user_name
     FROM comments c JOIN users u ON c.user_id = u.id
     WHERE c.id = ?`,
    [result.insertId]
  );
  return rows[0];
}

async function getCommentsByTicket(ticketId) {
  const [rows] = await pool.query(
    `SELECT c.*, u.name AS user_name
     FROM comments c JOIN users u ON c.user_id = u.id
     WHERE c.ticket_id = ?
     ORDER BY c.created_at ASC`,
    [ticketId]
  );
  return rows;
}

module.exports = { addComment, getCommentsByTicket };
