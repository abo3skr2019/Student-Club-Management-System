const express = require('express');
const router = express.Router();

const mainController = require('../controllers/mainController');

router.get('/', mainController.getIndex);
router.get('/dashboard', mainController.getTicketDashboard);
router.get('/contact', mainController.getContact);
router.post('/contact', mainController.submitContact);

module.exports = router;
