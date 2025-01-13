const User = require('../models/User');
const userService = require('../services/userService');

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

exports.deleteAccount = async (req, res) => {
    try {
        await User.findByIdAndDelete(req.user.id);
        req.session.destroy(error => {
            if (error) console.log(error);
            res.redirect('/');
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
};

exports.changeRole = async (req, res) => {
    const { role } = req.body;
    try {
        await userService.ChangeRole(req.user.id, role);
        res.redirect('/profile');
    } catch (error) {
        console.error(error);
        res.status(500).render('error', {
            message: 'Error changing role',
            user: req.user
        });
    }
};

exports.renderChangeRoleForm = (req, res) => {
    //HTML
    res.send(`
        <form action="/change-role" method="POST">
            <input type="text" name="role" placeholder="Enter new role">
            <button type="submit">Change Role</button>
        </form>
    `);
}