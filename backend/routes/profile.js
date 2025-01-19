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
router.get('/profile', isAuthenticated, (req, res) => {
    res.render('profile', {
        title: "وصل - الملف الشخصي",
        HeaderOrSidebar: 'header',
        extraCSS: '<link href="/css/profile.css" rel="stylesheet">',
        currentPage: 'profile',
        user: req.user
    });
});

// Render delete account page
router.get('/delete-account', isAuthenticated, (req, res) => {
    res.render('delete-account', {
        title: "وصل - حذف الحساب",
        HeaderOrSidebar: 'header',
        extraCSS: '<link href="/css/delete-account.css" rel="stylesheet">',
        currentPage: 'delete-account',
        user: req.user
    });
});

// Handle account deletion
router.post('/delete-account', isAuthenticated, profileController.deleteAccount);

module.exports = router;