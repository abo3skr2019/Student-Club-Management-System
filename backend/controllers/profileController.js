const User = require('../models/User');
const userService = require('../services/userService');

// Render the profile update form
/** 
 * Render the profile update form
 * @param {Request} req - The request object
 * @param {Response} res - The response object
 * @returns {void}
 */
const renderUpdateProfileForm = (req, res) => {
    res.render('update-profile', { user: req.user });
};

// Handle the profile update form submission
/** 
 * Update the logged-in user's profile
 * @param {Request} req - The request object
 * @param {Response} res - The response object
 * @returns {void}
 */
const updateProfile = async (req, res) => {
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

/** 
 * Render the logged-in user's profile
 * @param {Request} req - The request object
 * @param {Response} res - The response object
 * @returns {void}
 */
const renderProfile = async (req, res) => {
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
/** 
 * Delete the logged-in user's account
 * @param {Request} req - The request object
 * @param {Response} res - The response object
 * @returns {void}
 */
const deleteAccount = async (req, res) => {
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

const changeRole = async (req, res) => {
    const { role } = req.body;
    try {
        await userService.changeRole(req.user.id, role);
        res.redirect('/profile');
    } catch (error) {
        console.error(error);
        res.status(500).render('error', {
            message: 'Error changing role',
            user: req.user
        });
    }
};

const renderChangeRoleForm = (req, res) => {
    res.render("change-role",{ user: req.user })
}

module.exports = {
    renderUpdateProfileForm,
    updateProfile,
    renderProfile,
    deleteAccount,
    changeRole,
    renderChangeRoleForm
};