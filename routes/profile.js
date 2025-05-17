const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middleware/CheckAuth');
const { parseQueryParams } = require('../middleware/QueryParser');
const {
    getProfile,
    createProfile,
    deleteAccount,
} = require('../dist/controllers/profileController');

// RESTful profile endpoints
router.get('/profile', isAuthenticated, parseQueryParams, getProfile);
// Create new user account (registration)
router.post('/profile', createProfile);
router.delete('/profile', isAuthenticated, deleteAccount);

module.exports = router;
