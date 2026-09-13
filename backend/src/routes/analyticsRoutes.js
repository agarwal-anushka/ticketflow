const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

router.get('/summary', authMiddleware, roleMiddleware(['admin', 'agent']), analyticsController.getSummary);

module.exports = router;
