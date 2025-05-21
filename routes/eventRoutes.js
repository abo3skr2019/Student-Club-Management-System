const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');
const { isAuthenticated } = require('../middleware/CheckAuth');
const { authorize } = require('../middleware/authorize');
const { ClubRole, GlobalRole } = require('../dist/lib/constants');
const validateBody = require('../middleware/validateBody');
const { insertEventSchema } = require('../dist/db/schema/event');

// Event edit routes
// router.get(
//     '/:eventId/edit',
//     isAuthenticated,
//     authorize([], [ClubRole.CLUB_ADMIN]),
//     eventController.getEventForEditing,
// );
router.put(
    '/:eventId',
    isAuthenticated,
    authorize([], [ClubRole.CLUB_ADMIN]),
    eventController.updateEvent,
);

// Delete route
router.delete(
    '/:eventId',
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

// API endpoint for event creation
router.post(
    '/',
    (req, res, next) => {
        console.log("req.body",req.body);
        next();
    },
    validateBody(insertEventSchema),
    eventController.createEventApi
);



module.exports = router;
