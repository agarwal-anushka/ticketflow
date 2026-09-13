const roleMiddleware = require('../middleware/roleMiddleware');

function mockRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe('roleMiddleware', () => {
  test('blocks unauthenticated requests', () => {
    const req = {};
    const res = mockRes();
    const next = jest.fn();

    roleMiddleware(['admin'])(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
  });

  test('blocks a role not in the allowed list', () => {
    const req = { user: { role: 'customer' } };
    const res = mockRes();
    const next = jest.fn();

    roleMiddleware(['admin', 'agent'])(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  test('allows a role in the allowed list', () => {
    const req = { user: { role: 'agent' } };
    const res = mockRes();
    const next = jest.fn();

    roleMiddleware(['admin', 'agent'])(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });
});
