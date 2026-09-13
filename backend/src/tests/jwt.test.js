const { signToken, verifyToken } = require('../utils/jwt');

describe('JWT utility', () => {
  test('signs and verifies a valid token', () => {
    const token = signToken({ id: 1, role: 'agent' });
    const decoded = verifyToken(token);
    expect(decoded.id).toBe(1);
    expect(decoded.role).toBe('agent');
  });

  test('throws when verifying a tampered token', () => {
    const token = signToken({ id: 1, role: 'agent' });
    const tampered = token.slice(0, -2) + 'xx';
    expect(() => verifyToken(tampered)).toThrow();
  });

  test('throws when verifying garbage input', () => {
    expect(() => verifyToken('not-a-real-token')).toThrow();
  });
});
