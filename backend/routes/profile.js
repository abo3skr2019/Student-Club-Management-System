const express = require('express');
const router = express.Router();
const {isAuthenticated}  = require('../middleware/CheckAuth');
const {validateProfileInput} = require('../middleware/ProfileValidation');
const profileController = require('../controllers/profileController');

// Render the profile update form
router.get('/update-profile', isAuthenticated, profileController.renderUpdateProfileForm);

// Handle the profile update form submission
router.post('/update-profile',isAuthenticated,validateProfileInput, profileController.updateProfile);

// Render the logged-in user's profile
router.get('/profile', isAuthenticated, profileController.renderProfile);

router.get('/delete-account', isAuthenticated, (req, res) => {
    res.render('delete-account');
});

router.post('/delete-account', isAuthenticated, profileController.deleteAccount);


module.exports = router;