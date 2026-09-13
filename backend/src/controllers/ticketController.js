const ticketService = require('../services/ticketService');
const assignmentService = require('../services/assignmentService');

async function createTicket(req, res, next) {
  try {
    const { title, description, priority } = req.body;
    if (!title) {
      return res.status(400).json({ error: 'title is required' });
    }
    const ticket = await ticketService.createTicket({
      title,
      description,
      priority,
      createdBy: req.user.id,
    });
    res.status(201).json(ticket);
  } catch (err) {
    next(err);
  }
}

async function listTickets(req, res, next) {
  try {
    const { status, priority, assigneeId } = req.query;
    const tickets = await ticketService.listTickets({ status, priority, assigneeId });
    res.json(tickets);
  } catch (err) {
    next(err);
  }
}

async function getTicket(req, res, next) {
  try {
    const ticket = await ticketService.getTicketWithComments(req.params.id);
    if (!ticket) return res.status(404).json({ error: 'Ticket not found' });
    res.json(ticket);
  } catch (err) {
    next(err);
  }
}

async function updateTicket(req, res, next) {
  try {
    const { field, value } = req.body;
    const allowed = ['status', 'priority', 'assignee_id', 'title', 'description'];
    if (!field || !allowed.includes(field)) {
      return res.status(400).json({ error: `field must be one of: ${allowed.join(', ')}` });
    }
    const updated = await ticketService.updateTicket(req.params.id, field, value, req.user.id);
    res.json(updated);
  } catch (err) {
    next(err);
  }
}

async function deleteTicket(req, res, next) {
  try {
    await ticketService.deleteTicket(req.params.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

async function autoAssign(req, res, next) {
  try {
    const result = await assignmentService.autoAssignTicket(req.params.id, req.user.id);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function addComment(req, res, next) {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ error: 'message is required' });
    const comment = await ticketService.addComment({
      ticketId: req.params.id,
      userId: req.user.id,
      message,
    });
    res.status(201).json(comment);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createTicket,
  listTickets,
  getTicket,
  updateTicket,
  deleteTicket,
  autoAssign,
  addComment,
};
