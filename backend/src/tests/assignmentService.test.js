jest.mock('../config/db');
jest.mock('../models/userModel');
jest.mock('../models/ticketModel');
jest.mock('../models/auditModel');

const { pool } = require('../config/db');
const userModel = require('../models/userModel');
const ticketModel = require('../models/ticketModel');
const auditModel = require('../models/auditModel');
const assignmentService = require('../services/assignmentService');

function mockConnection() {
  return {
    beginTransaction: jest.fn(),
    commit: jest.fn(),
    rollback: jest.fn(),
    release: jest.fn(),
    query: jest.fn(),
  };
}

describe('assignmentService.autoAssignTicket', () => {
  let connection;

  beforeEach(() => {
    connection = mockConnection();
    pool.getConnection = jest.fn().mockResolvedValue(connection);
    jest.clearAllMocks();
    pool.getConnection = jest.fn().mockResolvedValue(connection);
  });

  test('assigns ticket to least-busy agent and commits', async () => {
    userModel.getLeastBusyAgent.mockResolvedValue({ id: 7, name: 'Priya', open_ticket_count: 1 });
    ticketModel.getTicketById.mockResolvedValue({ id: 100, assignee_id: null });
    ticketModel.updateTicketField.mockResolvedValue();
    auditModel.logAudit.mockResolvedValue();

    const result = await assignmentService.autoAssignTicket(100, 1);

    expect(connection.beginTransaction).toHaveBeenCalled();
    expect(ticketModel.updateTicketField).toHaveBeenCalledWith(connection, 100, 'assignee_id', 7);
    expect(auditModel.logAudit).toHaveBeenCalled();
    expect(connection.commit).toHaveBeenCalled();
    expect(connection.release).toHaveBeenCalled();
    expect(result).toEqual({ agentId: 7, agentName: 'Priya' });
  });

  test('rolls back and throws 422 when no agents are available', async () => {
    userModel.getLeastBusyAgent.mockResolvedValue(null);

    await expect(assignmentService.autoAssignTicket(100, 1)).rejects.toMatchObject({
      statusCode: 422,
    });

    expect(connection.rollback).toHaveBeenCalled();
    expect(connection.release).toHaveBeenCalled();
    expect(ticketModel.updateTicketField).not.toHaveBeenCalled();
  });

  test('rolls back and throws 404 when ticket does not exist', async () => {
    userModel.getLeastBusyAgent.mockResolvedValue({ id: 7, name: 'Priya' });
    ticketModel.getTicketById.mockResolvedValue(null);

    await expect(assignmentService.autoAssignTicket(999, 1)).rejects.toMatchObject({
      statusCode: 404,
    });

    expect(connection.rollback).toHaveBeenCalled();
  });

  test('rolls back on unexpected DB error and always releases connection', async () => {
    userModel.getLeastBusyAgent.mockResolvedValue({ id: 7, name: 'Priya' });
    ticketModel.getTicketById.mockResolvedValue({ id: 100, assignee_id: null });
    ticketModel.updateTicketField.mockRejectedValue(new Error('DB write failed'));

    await expect(assignmentService.autoAssignTicket(100, 1)).rejects.toThrow('DB write failed');

    expect(connection.rollback).toHaveBeenCalled();
    expect(connection.release).toHaveBeenCalled();
  });
});
