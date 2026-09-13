const express = require('express');
const router = express.Router();
const ticketController = require('../controllers/ticketController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

router.use(authMiddleware);

router.get('/', ticketController.listTickets);
router.post('/', ticketController.createTicket);
router.get('/:id', ticketController.getTicket);
router.put('/:id', roleMiddleware(['admin', 'agent']), ticketController.updateTicket);
router.delete('/:id', roleMiddleware(['admin']), ticketController.deleteTicket);
router.post('/:id/auto-assign', roleMiddleware(['admin', 'agent']), ticketController.autoAssign);
router.post('/:id/comments', ticketController.addComment);

module.exports = router;
