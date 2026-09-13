jest.mock('../models/ticketModel');
jest.mock('../models/commentModel');
jest.mock('../models/auditModel');

const ticketModel = require('../models/ticketModel');
const commentModel = require('../models/commentModel');
const auditModel = require('../models/auditModel');
const ticketService = require('./ticketService');

const customer = (id) => ({ id, role: 'customer' });
const agent = (id) => ({ id, role: 'agent' });

describe('ticketService.listTickets', () => {
  afterEach(() => jest.clearAllMocks());

  test('scopes to createdBy for a customer', async () => {
    ticketModel.listTickets.mockResolvedValue([]);
    await ticketService.listTickets({ status: 'open' }, customer(7));
    expect(ticketModel.listTickets).toHaveBeenCalledWith({ status: 'open', createdBy: 7 });
  });

  test('does not scope for an agent', async () => {
    ticketModel.listTickets.mockResolvedValue([]);
    await ticketService.listTickets({ status: 'open' }, agent(7));
    expect(ticketModel.listTickets).toHaveBeenCalledWith({ status: 'open' });
  });
});

describe('ticketService.getTicketWithComments', () => {
  afterEach(() => jest.clearAllMocks());

  test('403s a customer reading someone else\'s ticket', async () => {
    ticketModel.getTicketById.mockResolvedValue({ id: 1, created_by: 99 });
    await expect(
      ticketService.getTicketWithComments(1, customer(7))
    ).rejects.toMatchObject({ statusCode: 403 });
  });

  test('allows a customer to read their own ticket', async () => {
    ticketModel.getTicketById.mockResolvedValue({ id: 1, created_by: 7 });
    commentModel.getCommentsByTicket.mockResolvedValue([]);
    auditModel.getAuditLogsForTicket.mockResolvedValue([]);
    const result = await ticketService.getTicketWithComments(1, customer(7));
    expect(result.id).toBe(1);
  });

  test('allows an agent to read any ticket', async () => {
    ticketModel.getTicketById.mockResolvedValue({ id: 1, created_by: 99 });
    commentModel.getCommentsByTicket.mockResolvedValue([]);
    auditModel.getAuditLogsForTicket.mockResolvedValue([]);
    const result = await ticketService.getTicketWithComments(1, agent(1));
    expect(result.id).toBe(1);
  });
});

describe('ticketService.addComment', () => {
  afterEach(() => jest.clearAllMocks());

  test('blocks a customer commenting on someone else\'s ticket', async () => {
    ticketModel.getTicketById.mockResolvedValue({ id: 1, created_by: 99 });
    await expect(
      ticketService.addComment({ ticketId: 1, userId: 7, message: 'hi' }, customer(7))
    ).rejects.toMatchObject({ statusCode: 403 });
  });

  test('allows the owning customer to comment', async () => {
    ticketModel.getTicketById.mockResolvedValue({ id: 1, created_by: 7 });
    commentModel.addComment.mockResolvedValue({ id: 5, message: 'hi' });
    const result = await ticketService.addComment({ ticketId: 1, userId: 7, message: 'hi' }, customer(7));
    expect(result.id).toBe(5);
  });
});