const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Render the profile update form
router.get('/update-profile', (req, res) => {
    if (!req.isAuthenticated()) {
        return res.redirect('/login');
    }
    res.render('update-profile', { user: req.user });
});

// Handle the profile update form submission
router.post('/update-profile', async (req, res) => {
    if (!req.isAuthenticated()) {
        return res.redirect('/login');
    }
    const { firstName, lastName } = req.body;
    try {
        const user = await User.findById(req.user.id);
        user.firstName = firstName;
        user.lastName = lastName;
        await user.save();
        res.redirect('/dashboard');
    } catch (error) {
        console.log(error);
        res.redirect('/update-profile');
    }
});

module.exports = router;