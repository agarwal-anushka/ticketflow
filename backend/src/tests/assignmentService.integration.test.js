/**
 * Integration test for the auto-assignment row lock, run against a
 * REAL MySQL instance (not mocks) — this is the test that actually
 * proves the concurrency claim in the README/resume: that two
 * simultaneous auto-assign calls can't both land on the same agent.
 *
 * assignmentService.test.js (mocked) proves the transaction is used
 * correctly. This test proves the lock it takes actually serializes
 * concurrent writers against real MySQL semantics.
 *
 * Skipped by default so the normal `npm test` (mocked, DB-free) run
 * stays fast and requires no database. Runs only when
 * RUN_INTEGRATION_TESTS=1 is set, which CI sets against a real MySQL
 * service container (see .github/workflows/ci.yml). To run locally:
 *
 *   RUN_INTEGRATION_TESTS=1 DB_HOST=localhost DB_PORT=3306 \
 *   DB_USER=root DB_PASSWORD=... DB_NAME=ticketflow_test npx jest assignmentService.integration
 *
 * against a throwaway database created from backend/sql/schema.sql.
 */

const runIntegration = process.env.RUN_INTEGRATION_TESTS === '1';
const describeIntegration = runIntegration ? describe : describe.skip;

describeIntegration('assignmentService.autoAssignTicket (real MySQL, concurrency)', () => {
  let pool;
  let assignmentService;
  let agentAId;
  let agentBId;
  let customerId;
  let ticketAId;
  let ticketBId;

  beforeAll(async () => {
    // Fresh module registry + real (unmocked) db config for this file only.
    jest.resetModules();
    ({ pool } = require('../config/db'));
    assignmentService = require('../services/assignmentService');

    const uniq = Date.now();

    const [agentA] = await pool.query(
      "INSERT INTO users (name, email, password_hash, role, is_active) VALUES (?, ?, 'x', 'agent', TRUE)",
      [`Integration Agent A ${uniq}`, `agent-a-${uniq}@test.local`]
    );
    agentAId = agentA.insertId;

    const [agentB] = await pool.query(
      "INSERT INTO users (name, email, password_hash, role, is_active) VALUES (?, ?, 'x', 'agent', TRUE)",
      [`Integration Agent B ${uniq}`, `agent-b-${uniq}@test.local`]
    );
    agentBId = agentB.insertId;

    const [customer] = await pool.query(
      "INSERT INTO users (name, email, password_hash, role, is_active) VALUES (?, ?, 'x', 'customer', TRUE)",
      [`Integration Customer ${uniq}`, `customer-${uniq}@test.local`]
    );
    customerId = customer.insertId;

    const [ticketA] = await pool.query(
      "INSERT INTO tickets (title, description, status, priority, created_by) VALUES (?, ?, 'open', 'medium', ?)",
      [`Integration ticket A ${uniq}`, 'test', customerId]
    );
    ticketAId = ticketA.insertId;

    const [ticketB] = await pool.query(
      "INSERT INTO tickets (title, description, status, priority, created_by) VALUES (?, ?, 'open', 'medium', ?)",
      [`Integration ticket B ${uniq}`, 'test', customerId]
    );
    ticketBId = ticketB.insertId;
  });

  afterAll(async () => {
    await pool.query('DELETE FROM audit_logs WHERE ticket_id IN (?, ?)', [ticketAId, ticketBId]);
    await pool.query('DELETE FROM tickets WHERE id IN (?, ?)', [ticketAId, ticketBId]);
    await pool.query('DELETE FROM users WHERE id IN (?, ?, ?)', [agentAId, agentBId, customerId]);
    await pool.end();
  });

  test('two simultaneous auto-assign calls, with two equally-idle agents, do not both pick the same agent', async () => {
    // Both agents start with 0 open tickets, so without the row lock,
    // both concurrent calls could read "least busy = agentA" before
    // either write commits, and both tickets would land on agentA.
    const [resultA, resultB] = await Promise.all([
      assignmentService.autoAssignTicket(ticketAId, customerId),
      assignmentService.autoAssignTicket(ticketBId, customerId),
    ]);

    expect([agentAId, agentBId]).toContain(resultA.agentId);
    expect([agentAId, agentBId]).toContain(resultB.agentId);
    expect(resultA.agentId).not.toBe(resultB.agentId);

    const [rows] = await pool.query(
      'SELECT id, assignee_id FROM tickets WHERE id IN (?, ?)',
      [ticketAId, ticketBId]
    );
    const assignedAgentIds = rows.map((r) => r.assignee_id).sort();
    expect(assignedAgentIds).toEqual([agentAId, agentBId].sort());
  });
});
