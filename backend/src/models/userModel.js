const { pool } = require('../config/db');

async function createUser({ name, email, passwordHash, role = 'customer' }) {
  const [result] = await pool.query(
    'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
    [name, email, passwordHash, role]
  );
  return { id: result.insertId, name, email, role };
}

async function findByEmail(email) {
  const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
  return rows[0] || null;
}

async function findById(id) {
  const [rows] = await pool.query(
    'SELECT id, name, email, role, is_active FROM users WHERE id = ?',
    [id]
  );
  return rows[0] || null;
}

async function getLeastBusyAgent(connection) {
  const conn = connection || pool;
  const [rows] = await conn.query(`
    SELECT u.id, u.name, COUNT(t.id) AS open_ticket_count
    FROM users u
    LEFT JOIN tickets t
      ON t.assignee_id = u.id
      AND t.status IN ('open', 'in_progress')
    WHERE u.role = 'agent' AND u.is_active = TRUE
    GROUP BY u.id
    ORDER BY open_ticket_count ASC
    LIMIT 1
    FOR UPDATE
  `);
  return rows[0] || null;
}

module.exports = { createUser, findByEmail, findById, getLeastBusyAgent };
