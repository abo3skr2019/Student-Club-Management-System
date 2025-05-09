const express = require('express');
const { isAuthenticated } = require('../middleware/CheckAuth');
const { authorize } = require('../middleware/authorize');
const { GlobalRole } = require('../dist/lib/constants');
const router = express.Router();

const mainController = require('../controllers/mainController');

router.get('/', mainController.getIndex);
router.get(
    '/admin/Tickets',
    isAuthenticated,
    authorize([GlobalRole.INMA_ADMIN], []),
    mainController.getTicketDashboard,
);
router.get('/contact', mainController.getContact);
router.post('/contact', mainController.submitContact);

module.exports = router;
