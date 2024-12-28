const express = require('express');
const router = express.Router();
const clubController = require('../controllers/clubController');

// Routes for Clubs API
router.get('/', clubController.getAllClubs);
router.get('/:clubId', clubController.getClubById);
router.post('/', clubController.createClub);
router.put('/:clubId', clubController.updateClub);
router.post('/:clubId/assign-admin', clubController.assignClubAdmin);

module.exports = router;