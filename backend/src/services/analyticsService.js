const ticketModel = require('../models/ticketModel');

async function getSummary() {
  return ticketModel.getAnalyticsSummary();
}

module.exports = { getSummary };
