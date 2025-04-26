const express = require('express');
const { microsoftLogin, microsoftCallback, loginFailure, logout } = require('../controllers/authController');
const router = express.Router();

// Microsoft Authentication Routes using MSAL
router.get('/microsoft', microsoftLogin);
router.get('/microsoft/callback', microsoftCallback);

// Login Failure Route
router.get('/login-failure', loginFailure);

// Logout Route
router.get('/logout', logout);

module.exports = router;
