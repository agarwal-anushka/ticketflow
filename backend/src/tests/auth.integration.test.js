jest.mock('../models/userModel');
jest.mock('bcrypt');
jest.mock('../config/db');

const request = require('supertest');
const bcrypt = require('bcrypt');
const userModel = require('../models/userModel');
const { checkConnection } = require('../config/db');
const app = require('../app');

describe('POST /api/auth/register', () => {
  afterEach(() => jest.clearAllMocks());

  test('returns 400 when required fields are missing', async () => {
    const res = await request(app).post('/api/auth/register').send({ email: 'a@b.com' });
    expect(res.status).toBe(400);
  });

  test('returns 201 and a token on success', async () => {
    userModel.findByEmail.mockResolvedValue(null);
    bcrypt.hash.mockResolvedValue('hashed');
    userModel.createUser.mockResolvedValue({ id: 1, name: 'Test', email: 'a@b.com', role: 'customer' });

    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Test', email: 'a@b.com', password: 'password123' });

    expect(res.status).toBe(201);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.email).toBe('a@b.com');
  });

  test('returns 409 for duplicate email', async () => {
    userModel.findByEmail.mockResolvedValue({ id: 1, email: 'a@b.com' });

    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Test', email: 'a@b.com', password: 'password123' });

    expect(res.status).toBe(409);
  });
});

describe('POST /api/auth/login', () => {
  afterEach(() => jest.clearAllMocks());

  test('returns 401 for wrong credentials', async () => {
    userModel.findByEmail.mockResolvedValue(null);

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nope@b.com', password: 'wrong' });

    expect(res.status).toBe(401);
  });
});

describe('Protected ticket routes without a token', () => {
  test('GET /api/tickets returns 401 without authorization header', async () => {
    const res = await request(app).get('/api/tickets');
    expect(res.status).toBe(401);
  });
});

describe('GET /api/health', () => {
  test('returns 200 with status ok when DB is reachable', async () => {
    checkConnection.mockResolvedValue(true);
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  test('returns 503 with status degraded when DB is unreachable', async () => {
    checkConnection.mockResolvedValue(false);
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(503);
    expect(res.body.status).toBe('degraded');
  });
});
