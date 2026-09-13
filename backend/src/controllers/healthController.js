const { checkConnection } = require('../config/db');

async function getHealth(req, res) {
  const dbHealthy = await checkConnection();
  const status = dbHealthy ? 200 : 503;

  res.status(status).json({
    status: dbHealthy ? 'ok' : 'degraded',
    uptimeSeconds: process.uptime(),
    database: dbHealthy ? 'connected' : 'unreachable',
    timestamp: new Date().toISOString(),
  });
}

module.exports = { getHealth };
