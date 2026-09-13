const pool = {
  query: jest.fn(),
  getConnection: jest.fn(),
};

const checkConnection = jest.fn().mockResolvedValue(true);

module.exports = { pool, checkConnection };
