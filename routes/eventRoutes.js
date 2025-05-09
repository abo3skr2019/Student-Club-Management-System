const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');
const { isAuthenticated } = require('../middleware/CheckAuth');
const { authorize } = require('../middleware/authorize');
const { ClubRole } = require('../dist/lib/constants');

// Event edit routes
router.get(
    '/:eventId/edit',
    isAuthenticated,
    authorize([], [ClubRole.CLUB_ADMIN]),
    eventController.renderEditEventForm,
);
router.post(
    '/:eventId/edit',
    isAuthenticated,
    authorize([], [ClubRole.CLUB_ADMIN]),
    eventController.updateEvent,
);

// Delete route
router.post(
    '/:eventId/delete',
    isAuthenticated,
    authorize([], [ClubRole.CLUB_ADMIN]),
    eventController.deleteEvent,
);

// Registration routes
router.post(
    '/:eventId/register',
    isAuthenticated,
    eventController.registerForEvent,
);
router.post(
    '/:eventId/unregister',
    isAuthenticated,
    eventController.unregisterFromEvent,
);

// Public Routes
router.get('/', eventController.getAllEvents);
router.get('/:eventId', eventController.getEventById);

module.exports = router;
