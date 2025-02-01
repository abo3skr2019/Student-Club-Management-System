const express = require('express');
const router = express.Router();
const clubController = require('../controllers/clubController');
const eventController = require('../controllers/eventController');
const { isAuthenticated } = require('../middleware/CheckAuth');
const { isAdmin, isClubAdmin } = require('../middleware/CheckRole');
const { validateEventInput, validateEventDates } = require('../middleware/EventValidation');

// Protected routes - require authentication
router.get('/create', isAuthenticated, isAdmin, clubController.renderCreateClubForm);
router.post('/create', isAuthenticated, isAdmin, clubController.createClub);

router.get('/:clubId/dashboard', isAuthenticated, isClubAdmin, clubController.renderDashboard);

router.get('/:clubId/edit', isAuthenticated, isClubAdmin, clubController.renderEditClubForm);
router.post('/:clubId/edit', isAuthenticated, isClubAdmin, clubController.updateClub);
router.get('/:clubId/assign-admin', isAuthenticated, isClubAdmin, clubController.renderAssignClubAdmin);
router.post('/:clubId/assign-admin', isAuthenticated, isClubAdmin, clubController.assignClubAdmin);

// Event creation routes for specific club
router.get('/:clubId/events/create', isAuthenticated, isClubAdmin, eventController.renderCreateEventForm);
router.post('/:clubId/events/create', isAuthenticated, isClubAdmin, validateEventInput, validateEventDates, eventController.createEvent);

// Public Routes
router.get('/', clubController.getAllClubs);
router.get('/:clubId', clubController.getClubById);

module.exports = router;