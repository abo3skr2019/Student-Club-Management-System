const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { isAuthenticated } = require('../middleware/CheckAuth');


// Render the profile update form
router.get('/update-profile',isAuthenticated, (req, res) => {
    res.render('update-profile', { user: req.user });
});

// Handle the profile update form submission
router.post('/update-profile',isAuthenticated, async (req, res) => {

    const { firstName, lastName } = req.body;
    try {
        const user = await User.findById(req.user.id);
        user.firstName = firstName;
        user.lastName = lastName;
        await user.save();
        res.redirect('/profile');
    } catch (error) {
        console.log(error);
        res.redirect('/update-profile');
    }
});

// Render the logged-in user's profile
router.get('/profile', isAuthenticated, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).send('User not found');
        }
        res.render('profile', { user });
    } catch (err) {
        res.status(500).send('Server error');
    }
});

module.exports = router;