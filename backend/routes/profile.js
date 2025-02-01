const express = require('express');
const router = express.Router();
const {isAuthenticated}  = require('../middleware/CheckAuth');
const {validateProfileInput} = require('../middleware/ProfileValidation');
const profileController = require('../controllers/profileController');

// Render the profile update form
router.get('/update-profile', isAuthenticated, profileController.renderUpdateProfileForm);

// Handle the profile update form submission
router.post('/update-profile', isAuthenticated, validateProfileInput, profileController.updateProfile);

// Render the logged-in user's profile
router.get('/profile', isAuthenticated, profileController.renderProfile);

// Render delete account page
router.get('/delete-account', isAuthenticated, profileController.renderDeleteAccount);

// Handle account deletion
router.post('/delete-account', isAuthenticated, profileController.deleteAccount);

// Test routes - only available in development environment
if (process.env.NODE_ENV === 'development') {
    router.get('/change-role', isAuthenticated, profileController.renderChangeRoleForm);
    router.post('/change-role', isAuthenticated, profileController.changeRole);
}
module.exports = router;