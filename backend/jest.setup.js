require('dotenv').config();

// Ensure a JWT secret exists even on a fresh clone/CI where no .env
// file is present, so jwt.js (and anything that signs/verifies
// tokens) doesn't crash with "secretOrPrivateKey must have a value".
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
