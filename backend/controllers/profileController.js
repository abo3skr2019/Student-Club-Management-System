const User = require('../models/User');

// Render the profile update form
exports.renderUpdateProfileForm = (req, res) => {
    res.render('update-profile', { user: req.user });
};

// Handle the profile update form submission
exports.updateProfile = async (req, res) => {
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
};

// Render the logged-in user's profile
exports.renderProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).send('User not found');
        }
        res.render('profile', { user });
    } catch (err) {
        res.status(500).send('Server error');
    }
};