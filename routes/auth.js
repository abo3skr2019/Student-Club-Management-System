const express = require('express');
const { getUser, logout } = require('../controllers/authController');
const { isAuthenticated } = require('../middleware/CheckAuth');
const router = express.Router();

// New route to return current user info based on the bearer token 
router.get('/user', isAuthenticated, getUser);

// Logout Route
router.get('/logout', logout);

module.exports = router;
