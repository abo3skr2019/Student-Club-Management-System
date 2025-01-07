const express = require('express');
const router = express.Router();
const clubController = require('../controllers/clubController');
const { isAuthenticated } = require('../middleware/CheckAuth');
const { isAdmin, isClubAdmin } = require('../middleware/CheckRole');

// Protected routes - require authentication
router.get('/create', mockAuthMiddleware, isAdmin, clubController.renderCreateClubForm);
router.post('/create', mockAuthMiddleware, isAdmin, clubController.createClub);
router.get('/:clubId/edit', mockAuthMiddleware, isClubAdmin, clubController.renderEditClubForm);
router.post('/:clubId/edit', mockAuthMiddleware, isClubAdmin, clubController.updateClub);
router.get('/:clubId/assign-admin', mockAuthMiddleware, isClubAdmin, clubController.renderAssignAdmin);
router.post('/:clubId/assign-admin', mockAuthMiddleware, isClubAdmin, clubController.assignClubAdmin);

// Public Routes
router.get('/', clubController.getAllClubs);
router.get('/:clubId', clubController.getClubById);

module.exports = router;