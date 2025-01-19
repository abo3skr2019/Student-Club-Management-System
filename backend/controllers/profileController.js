const User = require('../models/User');

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
        res.render('update-profile', {
            title: "وصل - تحديث الملف الشخصي",
            HeaderOrSidebar: 'header',
            extraCSS: '<link href="/css/update-profile.css" rel="stylesheet">',
            currentPage: 'update-profile',
            user: req.user,
            error: 'Failed to update profile'
        });
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
            return res.render('error', {
                title: "وصل - خطأ",
                HeaderOrSidebar: 'header',
                message: 'User not found',
                user: req.user
            });
        }
        res.render('profile', {
            title: "وصل - الملف الشخصي",
            HeaderOrSidebar: 'header',
            extraCSS: '<link href="/css/profile.css" rel="stylesheet">',
            currentPage: 'profile',
            user
        });
    } catch (err) {
        res.render('error', {
            title: "وصل - خطأ",
            HeaderOrSidebar: 'header',
            message: 'Server error',
            user: req.user
        });
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
        res.render('error', {
            title: "وصل - خطأ",
            HeaderOrSidebar: 'header',
            message: 'Server error',
            user: req.user
        });
    }
};

module.exports = {
    renderUpdateProfileForm,
    updateProfile,
    renderProfile,
    deleteAccount
};