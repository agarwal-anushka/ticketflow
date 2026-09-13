const analyticsService = require('../services/analyticsService');

async function getSummary(req, res, next) {
  try {
    const summary = await analyticsService.getSummary();
    res.json(summary);
  } catch (err) {
    next(err);
  }
}

module.exports = { getSummary };
