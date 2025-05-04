const { db } = require('../dist/db');
const {
    user,
    userToEventJoined,
    clubMembership,
} = require('../dist/db/schema');
const { updateUserSchema } = require('../dist/db/schema/user');
const { eq, and } = require('drizzle-orm');
const { z } = require('zod');
const { ClubRole } = require('../dist/db/schema/user');

/**
 * Render the profile update form
 * @param {Request} req - The request object
 * @param {Response} res - The response object
 * @returns {void}
 */
const renderUpdateProfileForm = (req, res) => {
    res.render('update-profile', {
        title: 'وصل - تحديث الملف الشخصي',
        HeaderOrSidebar: 'header',
        extraCSS: '<link href="/css/update-profile.css" rel="stylesheet">',
        currentPage: 'update-profile',
        user: req.user,
    });
};

/**
 * Update the logged-in user's profile
 * @param {Request} req - The request object
 * @param {Response} res - The response object
 * @returns {void}
 */
const updateProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const { firstName, lastName } = req.body;

        // Validate input
        const validatedData = updateUserSchema.safeParse({
            firstName,
            lastName,
        });

        if (!validatedData.success) {
            return res.redirect('/update-profile');
        }

        // Update user profile
        await db
            .update(user)
            .set({
                firstName: validatedData.data.firstName,
                lastName: validatedData.data.lastName || null,
                updatedAt: new Date(),
            })
            .where(eq(user.id, userId));

        // Update session with new data
        req.user = {
            ...req.user,
            firstName: validatedData.data.firstName,
            lastName: validatedData.data.lastName || null,
        };

        res.redirect('/profile');
    } catch (error) {
        console.error('Error updating profile:', error);
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
        const userData = await db.query.user.findFirst({
            where: eq(user.id, req.user.id),
            with: {
                eventsJoined: {
                    with: {
                        event: {
                            columns: {
                                name: true,
                                eventStart: true,
                                location: true,
                                uuid: true,
                            },
                        },
                    },
                },
            },
        });

        if (!userData) {
            return res.status(404).render('error', {
                message: 'User not found',
                user: req.user,
            });
        }

        res.render('profile', {
            title: 'وصل - الملف الشخصي',
            HeaderOrSidebar: 'header',
            extraCSS: '<link href="/css/profile.css" rel="stylesheet">',
            currentPage: 'profile',
            user: {
                ...userData,
                eventsJoined: userData.eventsJoined.map((join) => ({
                    ...join.event,
                    eventStart: join.event.eventStart,
                })),
            },
        });
    } catch (error) {
        console.error('Error in renderProfile:', error);
        res.status(500).render('error', {
            message: 'Server error',
            user: req.user,
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
        // Delete user's event registrations first (cascade will handle this)
        await db.delete(user).where(eq(user.id, req.user.id));

        // Destroy the session
        req.session.destroy((error) => {
            if (error) console.error('Session destruction error:', error);
            res.redirect('/');
        });
    } catch (error) {
        console.error('Error in deleteAccount:', error);
        res.status(500).render('error', {
            message: 'Server error',
            user: req.user,
        });
    }
};

/**
 * Render the delete account confirmation page
 * @param {Request} req - The request object
 * @param {Response} res - The response object
 * @returns {void}
 */
const renderDeleteAccount = async (req, res) => {
    try {
        // Check if user is admin of any clubs
        const adminClubs = await db.query.clubMembership.findMany({
            where: and(
                eq(clubMembership.userId, req.user.id),
                eq(clubMembership.role, ClubRole.CLUB_ADMIN),
            ),
            with: {
                club: {
                    columns: {
                        name: true,
                    },
                },
            },
        });

        console.log('Admin Clubs:', adminClubs);
        console.log('Is Club Admin:', adminClubs.length > 0);

        res.render('delete-account', {
            title: 'وصل - حذف الحساب',
            HeaderOrSidebar: 'header',
            extraCSS: '<link href="/css/delete-account.css" rel="stylesheet">',
            currentPage: 'delete-account',
            user: req.user,
            isClubAdmin: adminClubs.length > 0,
            adminClubs: adminClubs,
        });
    } catch (error) {
        console.error('Error in renderDeleteAccount:', error);
        res.status(500).render('error', {
            message: 'Server error',
            user: req.user,
        });
    }
};

module.exports = {
    renderUpdateProfileForm,
    updateProfile,
    renderProfile,
    renderDeleteAccount,
    deleteAccount,
};
