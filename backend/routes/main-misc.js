const express = require('express');
const { isAuthenticated } = require('../middleware/CheckAuth');
const { isAdmin } = require('../middleware/CheckRole');
const router = express.Router();

const mainController = require('../controllers/mainController');

router.get('/', mainController.getIndex);
router.get('/admin/Tickets',isAuthenticated,isAdmin, mainController.getTicketDashboard);
router.get('/contact', mainController.getContact);
router.post('/contact', mainController.submitContact);

module.exports = router;
