const bcrypt = require('bcrypt');
const userModel = require('../models/userModel');
const { signToken } = require('../utils/jwt');

const SALT_ROUNDS = 10;

async function register({ name, email, password, role }) {
  const existing = await userModel.findByEmail(email);
  if (existing) {
    const err = new Error('Email already registered');
    err.statusCode = 409;
    throw err;
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const user = await userModel.createUser({
    name,
    email,
    passwordHash,
    role: role === 'admin' ? 'customer' : role, // prevent self-registering as admin
  });

  const token = signToken({ id: user.id, role: user.role });
  return { user, token };
}

async function login({ email, password }) {
  const user = await userModel.findByEmail(email);
  if (!user || !user.is_active) {
    const err = new Error('Invalid email or password');
    err.statusCode = 401;
    throw err;
  }

  const isMatch = await bcrypt.compare(password, user.password_hash);
  if (!isMatch) {
    const err = new Error('Invalid email or password');
    err.statusCode = 401;
    throw err;
  }

  const token = signToken({ id: user.id, role: user.role });
  return {
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
    token,
  };
}

module.exports = { register, login };
