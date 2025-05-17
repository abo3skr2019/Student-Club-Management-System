const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middleware/CheckAuth');
const { getProfile, updateProfile, deleteAccount } = require('../controllers/profileController');

// RESTful profile endpoints
// Get current user profile
router.get('/profile', isAuthenticated, getProfile);

// Update current user profile
router.put('/profile', isAuthenticated, updateProfile);

// Delete current user account
router.delete('/profile', isAuthenticated, deleteAccount);

module.exports = router;
