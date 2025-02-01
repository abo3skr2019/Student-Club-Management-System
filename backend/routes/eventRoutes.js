const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');
const { isAuthenticated } = require('../middleware/CheckAuth');
const { isClubAdmin } = require('../middleware/CheckRole');
const { validateEventInput, validateEventDates } = require('../middleware/EventValidation');

// Event edit routes
router.get('/:eventId/edit', isAuthenticated, isClubAdmin, eventController.renderEditEventForm);
router.post('/:eventId/edit', isAuthenticated, isClubAdmin, validateEventInput, validateEventDates, eventController.updateEvent);

// Delete route
router.post('/:eventId/delete', isAuthenticated, isClubAdmin, eventController.deleteEvent);

// Registration routes
router.post('/:eventId/register', isAuthenticated, eventController.registerForEvent);
router.post('/:eventId/unregister', isAuthenticated, eventController.unregisterFromEvent);

// Public Routes
router.get('/', eventController.getAllEvents);
router.get('/:eventId', eventController.getEventById);

module.exports = router;