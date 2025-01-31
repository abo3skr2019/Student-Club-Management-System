const User = require('../models/User');
const {isAuthenticated} = require("../middleware/CheckAuth");

// Render the profile update form
/**
 * Render the profile update form
 * @param {Request} req - The request object
 * @param {Response} res - The response object
 * @returns {void}
 */
const renderUpdateProfileForm = (req, res) => {
    res.render('update-profile', {
        title: "وصل - تحديث الملف الشخصي",
        HeaderOrSidebar: 'header',
        extraCSS: '<link href="/css/update-profile.css" rel="stylesheet">',
        currentPage: 'update-profile',
        user: req.user
    });
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

        const userWithClubUUID = {
            ...user.toObject(),
            clubUUID: req.user.clubUUID
        };

        res.render('profile', {
            title: "وصل - الملف الشخصي",
            HeaderOrSidebar: 'header',
            extraCSS: '<link href="/css/profile.css" rel="stylesheet">',
            currentPage: 'profile',
            user: userWithClubUUID
        });
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

const renderDeleteAccount = (req, res) => {
    res.render('delete-account', {
        title: "وصل - حذف الحساب",
        HeaderOrSidebar: 'header',
        extraCSS: '<link href="/css/delete-account.css" rel="stylesheet">',
        currentPage: 'delete-account',
        user: req.user
    });
};

module.exports = {
    renderUpdateProfileForm,
    updateProfile,
    renderProfile,
    renderDeleteAccount,
    deleteAccount
};