jest.mock('../models/userModel');
jest.mock('bcrypt');

const bcrypt = require('bcrypt');
const userModel = require('../models/userModel');
const authService = require('../services/authService');

describe('authService.register', () => {
  afterEach(() => jest.clearAllMocks());

  test('throws 409 if email already exists', async () => {
    userModel.findByEmail.mockResolvedValue({ id: 1, email: 'a@b.com' });

    await expect(
      authService.register({ name: 'A', email: 'a@b.com', password: 'pw' })
    ).rejects.toMatchObject({ statusCode: 409 });
  });

  test('hashes password and creates user with default role', async () => {
    userModel.findByEmail.mockResolvedValue(null);
    bcrypt.hash.mockResolvedValue('hashed_pw');
    userModel.createUser.mockResolvedValue({ id: 2, name: 'A', email: 'a@b.com', role: 'customer' });

    const result = await authService.register({ name: 'A', email: 'a@b.com', password: 'pw' });

    expect(bcrypt.hash).toHaveBeenCalledWith('pw', 10);
    expect(result.user.role).toBe('customer');
    expect(result.token).toBeDefined();
  });

  test('prevents self-registration as admin', async () => {
    userModel.findByEmail.mockResolvedValue(null);
    bcrypt.hash.mockResolvedValue('hashed_pw');
    userModel.createUser.mockImplementation((data) =>
      Promise.resolve({ id: 3, ...data, passwordHash: undefined })
    );

    await authService.register({ name: 'A', email: 'a@b.com', password: 'pw', role: 'admin' });

    expect(userModel.createUser).toHaveBeenCalledWith(
      expect.objectContaining({ role: 'customer' })
    );
  });
});

describe('authService.login', () => {
  afterEach(() => jest.clearAllMocks());

  test('rejects unknown email', async () => {
    userModel.findByEmail.mockResolvedValue(null);
    await expect(
      authService.login({ email: 'x@y.com', password: 'pw' })
    ).rejects.toMatchObject({ statusCode: 401 });
  });

  test('rejects wrong password', async () => {
    userModel.findByEmail.mockResolvedValue({
      id: 1,
      email: 'x@y.com',
      password_hash: 'hashed',
      is_active: true,
    });
    bcrypt.compare.mockResolvedValue(false);

    await expect(
      authService.login({ email: 'x@y.com', password: 'wrong' })
    ).rejects.toMatchObject({ statusCode: 401 });
  });

  test('returns token on valid credentials', async () => {
    userModel.findByEmail.mockResolvedValue({
      id: 1,
      name: 'A',
      email: 'x@y.com',
      password_hash: 'hashed',
      role: 'agent',
      is_active: true,
    });
    bcrypt.compare.mockResolvedValue(true);

    const result = await authService.login({ email: 'x@y.com', password: 'correct' });

    expect(result.token).toBeDefined();
    expect(result.user.role).toBe('agent');
  });
});
