const express = require('express');
const router = express.Router();

// Microsoft Authentication Routes using MSAL
router.get('/microsoft')

router.get('/microsoft/callback')

// Login Failure Route
router.get('/login-failure');

// Logout Route
router.get('/logout');


module.exports = router;
