const express = require('express');
const router = express.Router();
const clubController = require('../controllers/clubController');
const { isAuthenticated } = require('../middleware/CheckAuth');
const { isAdmin, isClubAdmin } = require('../middleware/CheckRoles');

// Public Routes
router.get('/', clubController.getAllClubs);
router.get('/:clubId', clubController.getClubById);

// Protected routes - require authentication
router.post('/', isAdmin, isAuthenticated, clubController.createClub);
router.put('/:clubId', isClubAdmin, isAuthenticated, clubController.updateClub);
router.post('/:clubId/assign-admin', isAuthenticated, clubController.assignClubAdmin);

module.exports = router;