const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { isAuthenticated } = require('../middleware/CheckAuth');
const profileController = require('../controllers/profileController');

// Render the profile update form
router.get('/update-profile',isAuthenticated,profileController.renderUpdateProfileForm);

// Handle the profile update form submission
router.post('/update-profile',isAuthenticated, profileController.updateProfile);

// Render the logged-in user's profile
router.get('/profile', isAuthenticated, profileController.renderProfile);

module.exports = router;