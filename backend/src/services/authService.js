const bcrypt = require('bcrypt');
const userModel = require('../models/userModel');
const { signToken } = require('../utils/jwt');

const SALT_ROUNDS = 10;

async function register({ name, email, password }) {
  const existing = await userModel.findByEmail(email);
  if (existing) {
    const err = new Error('Email already registered');
    err.statusCode = 409;
    throw err;
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  // Deny-by-default: public registration can only ever create a
  // 'customer' account, regardless of what the request body sends.
  // Agent/admin accounts are provisioned out-of-band, never chosen
  // by the registrant.
  const user = await userModel.createUser({
    name,
    email,
    passwordHash,
    role: 'customer',
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