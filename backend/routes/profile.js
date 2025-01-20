const express = require('express');
const router = express.Router();
const {isAuthenticated}  = require('../middleware/CheckAuth');
const {validateProfileInput} = require('../middleware/ProfileValidation');
const profileController = require('../controllers/profileController');

// Render the profile update form
router.get('/update-profile', isAuthenticated, (req, res) => {
    res.render('update-profile', {
        title: "وصل - تحديث الملف الشخصي",
        HeaderOrSidebar: 'header',
        extraCSS: '<link href="/css/update-profile.css" rel="stylesheet">',
        currentPage: 'update-profile',
        user: req.user
    });
});

// Handle the profile update form submission
router.post('/update-profile', isAuthenticated, validateProfileInput, profileController.updateProfile);

// Render the logged-in user's profile
router.get('/profile', isAuthenticated, profileController.renderProfile);

// Render delete account page
router.get('/delete-account', isAuthenticated, profileController.renderDeleteAccount);

// Handle account deletion
router.post('/delete-account', isAuthenticated, profileController.deleteAccount);

module.exports = router;