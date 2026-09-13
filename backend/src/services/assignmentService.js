const { pool } = require('../config/db');
const userModel = require('../models/userModel');
const ticketModel = require('../models/ticketModel');
const auditModel = require('../models/auditModel');

/**
 * Assigns a ticket to the least-busy active agent.
 * Wrapped in a transaction so concurrent calls don't both read the
 * same "least busy" agent before either write commits.
 */
async function autoAssignTicket(ticketId, actingUserId) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const agent = await userModel.getLeastBusyAgent(connection);
    if (!agent) {
      const err = new Error('No active agents available for assignment');
      err.statusCode = 422;
      throw err;
    }

    const ticket = await ticketModel.getTicketById(ticketId);
    if (!ticket) {
      const err = new Error('Ticket not found');
      err.statusCode = 404;
      throw err;
    }

    await ticketModel.updateTicketField(connection, ticketId, 'assignee_id', agent.id);
    await auditModel.logAudit(connection, {
      ticketId,
      changedBy: actingUserId,
      field: 'assignee_id',
      oldValue: ticket.assignee_id,
      newValue: agent.id,
    });

    await connection.commit();
    return { agentId: agent.id, agentName: agent.name };
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
}

module.exports = { autoAssignTicket };
