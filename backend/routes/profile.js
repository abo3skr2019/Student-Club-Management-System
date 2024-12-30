const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Render the profile update form
router.get('/update-profile', (req, res) => {
    res.render('update-profile', { user: req.user });
});

// Handle the profile update form submission
router.post('/update-profile', async (req, res) => {

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


// render User profile
router.get('/profile/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).send('User not found');
        }
        res.render('profile', { user });
    } catch (err) {
        res.status(500).send('Server error');
    }
});
module.exports = router;
