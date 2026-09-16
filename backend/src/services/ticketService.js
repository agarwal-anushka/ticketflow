const { pool } = require('../config/db');
const ticketModel = require('../models/ticketModel');
const commentModel = require('../models/commentModel');
const auditModel = require('../models/auditModel');

async function createTicket(data) {
  return ticketModel.createTicket(data);
}

async function listTickets(filters, requester) {
  // Customers can only ever see their own tickets. Agents/admins see
  // everything (optionally scoped by their own query filters).
  const scoped = requester.role === 'customer'
    ? { ...filters, createdBy: requester.id }
    : filters;
  return ticketModel.listTickets(scoped);
}

async function getTicketWithComments(id, requester) {
  const ticket = await ticketModel.getTicketById(id);
  if (!ticket) return null;

  if (requester.role === 'customer' && ticket.created_by !== requester.id) {
    const err = new Error('Not authorized to view this ticket');
    err.statusCode = 403;
    throw err;
  }

  const comments = await commentModel.getCommentsByTicket(id);
  const auditLogs = await auditModel.getAuditLogsForTicket(id);
  return { ...ticket, comments, auditLogs };
}

/**
 * Updates a single field on a ticket and records the change in the audit log.
 * Uses a transaction so the update + audit write are atomic. The
 * pre-update read happens on the same transactional connection, not a
 * separate pooled one, so the oldValue captured for the audit log is
 * consistent with what's being changed under the lock.
 */
async function updateTicket(ticketId, field, newValue, actingUserId) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const ticket = await ticketModel.getTicketById(ticketId, connection);
    if (!ticket) {
      const err = new Error('Ticket not found');
      err.statusCode = 404;
      throw err;
    }

    const oldValue = ticket[field];
    await ticketModel.updateTicketField(connection, ticketId, field, newValue);
    await auditModel.logAudit(connection, {
      ticketId,
      changedBy: actingUserId,
      field,
      oldValue,
      newValue,
    });

    await connection.commit();
    return ticketModel.getTicketById(ticketId);
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
}

async function deleteTicket(id) {
  const ticket = await ticketModel.getTicketById(id);
  if (!ticket) {
    const err = new Error('Ticket not found');
    err.statusCode = 404;
    throw err;
  }
  await ticketModel.deleteTicket(id);
}

async function addComment({ ticketId, userId, message }, requester) {
  const ticket = await ticketModel.getTicketById(ticketId);
  if (!ticket) {
    const err = new Error('Ticket not found');
    err.statusCode = 404;
    throw err;
  }
  if (requester.role === 'customer' && ticket.created_by !== requester.id) {
    const err = new Error('Not authorized to comment on this ticket');
    err.statusCode = 403;
    throw err;
  }
  return commentModel.addComment({ ticketId, userId, message });
}

module.exports = {
  createTicket,
  listTickets,
  getTicketWithComments,
  updateTicket,
  deleteTicket,
  addComment,
};
