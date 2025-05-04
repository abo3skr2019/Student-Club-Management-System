const clubService = require('../services/clubService');
const { ClubRole } = require('../dist/db/schema/user');
const { GlobalRole } = require('../dist/db/schema/user');

/**
 * Get all clubs
 * @param {Object} req Express request object
 * @param {Object} res Express response object
 */
const getAllClubs = async (req, res) => {
    try {
        const clubs = await clubService.getAllClubs();
        res.render('clubs/club-list', {
            clubs: clubs.map((club) => ({
                ...club,
                clubAdmin: club.memberships[0]?.user || null,
            })),
            user: req.user,
            isAdmin: req.user?.role === ClubRole.ADMIN,
        });
    } catch (error) {
        console.error('Error in getAllClubs:', error);
        res.status(500).render('error', {
            message: 'Failed to fetch clubs',
            user: req.user,
        });
    }
};

/**
 * Get club by UUID
 * @param {Object} req Express request object
 * @param {Object} res Express response object
 */
const getClubById = async (req, res) => {
    try {
        const clubData = await clubService.findByUUID(req.params.clubId);
        const isClubAdmin = clubData.memberships.some(
            (m) => m.user.id === req.user?.id && m.role === ClubRole.CLUB_ADMIN,
        );

        res.render('clubs/club-details', {
            club: {
                ...clubData,
                clubAdmin: clubData.adminMembership?.user || null,
            },
            user: req.user,
            isAdmin: req.user?.globalRole === GlobalRole.ADMIN,
            isClubAdmin,
            error: req.query.error,
            email: req.query.email,
        });
    } catch (error) {
        console.error('Error in getClubById:', error);
        res.status(404).render('error', {
            message: 'Club not found',
            user: req.user,
        });
    }
};

/**
 * Render Club Creation Form
 * @param {Object} req Express request object
 * @param {Object} res Express response object
 */
const renderCreateClubForm = async (req, res) => {
    try {
        res.render('clubs/create-club', {
            user: req.user,
        });
    } catch (error) {
        console.error('Error in renderCreateClubForm:', error);
        res.status(500).render('error', {
            message: 'Error loading form',
            user: req.user,
        });
    }
};

/**
 * Create new club
 * @param {Object} req Express request object
 * @param {Object} res Express response object
 */
const createClub = async (req, res) => {
    try {
        const clubData = await clubService.createClub(req.body, req.user.id);
        res.redirect(`/clubs/${clubData.uuid}`);
    } catch (error) {
        console.error('Error in createClub:', error);
        res.status(400).render('clubs/create-club', {
            club: req.body,
            error: error.message,
            user: req.user,
        });
    }
};

/**
 * Render Edit Club Form
 * @param {Object} req Express request object
 * @param {Object} res Express response object
 */
const renderEditClubForm = async (req, res) => {
    try {
        const clubData = await clubService.findByUUID(req.params.clubId);
        res.render('clubs/update-club', {
            club: clubData,
            user: req.user,
        });
    } catch (error) {
        console.error('Error in renderEditClubForm:', error);
        res.status(404).render('error', {
            message: 'Club not found',
            user: req.user,
        });
    }
};

const joinClub = async (req, res) => {
    try {
        const { clubId } = req.params;
        const userId = req.user.id;
        const clubData = await clubService.findByUUID(clubId);
        if (!clubData) {
            return res.status(404).render('error', {
                message: 'Club not found',
                user: req.user,
            });
        }
        // Check if the user is already a member of the club
        const isMember = clubData.memberships.some(
            (membership) => membership.user.id === userId,
        );
        if (isMember) {
            return res.redirect(`/clubs/${clubId}?error=already_member`);
        }
        // Join the club
        await clubService.joinClub(clubId, userId);
        res.redirect(`/clubs/${clubId}`);
    } catch (error) {
        console.error('Error in joinClub:', error);
        res.status(500).json({ message: 'Error joining club' });
    }
};

/**
 * Update club
 * @param {Object} req Express request object
 * @param {Object} res Express response object
 */
const updateClub = async (req, res) => {
    try {
        const clubData = await clubService.updateClub(
            req.params.clubId,
            req.body,
        );
        res.redirect(`/clubs/${clubData.uuid}/dashboard`);
    } catch (error) {
        console.error('Error in updateClub:', error);
        if (error.message === 'Club not found') {
            return res.status(404).render('error', {
                message: 'Club not found',
                user: req.user,
            });
        }
        res.render('clubs/update-club', {
            club: { uuid: req.params.clubId, ...req.body },
            error: error.message,
            user: req.user,
        });
    }
};

/**
 * Render Assign Club Admin Form
 * @param {Object} req Express request object
 * @param {Object} res Express response object
 */
const renderAssignClubAdmin = async (req, res) => {
    try {
        const clubData = await clubService.findByUUID(req.params.clubId);
        res.render('clubs/assign-admin', {
            club: clubData,
            user: req.user,
        });
    } catch (error) {
        console.error('Error in renderAssignClubAdmin:', error);
        res.render('error', {
            message: 'Club not found',
            user: req.user,
        });
    }
};

/**
 * Assign new club admin
 * @param {Object} req Express request object
 * @param {Object} res Express response object
 */
const assignClubAdmin = async (req, res) => {
    try {
        const { email } = req.body;
        await clubService.assignClubAdmin(req.params.clubId, email);
        res.redirect(`/clubs/${req.params.clubId}?success=admin_assigned`);
    } catch (error) {
        console.error('Error in assignClubAdmin:', error);

        if (error.message === 'User not found') {
            return res.redirect(
                `/clubs/${req.params.clubId}?error=user_not_found&email=${encodeURIComponent(req.body.email)}`,
            );
        }

        if (error.message === 'User is already an admin of this club') {
            return res.redirect(
                `/clubs/${req.params.clubId}?error=already_admin&email=${encodeURIComponent(req.body.email)}`,
            );
        }

        if (error.message === 'Invalid email format') {
            return res.redirect(
                `/clubs/${req.params.clubId}?error=invalid_email&email=${encodeURIComponent(req.body.email)}`,
            );
        }

        if (error.message === 'Club not found') {
            return res.redirect(
                `/clubs/${req.params.clubId}?error=club_not_found`,
            );
        }

        return res.render('error', {
            message: 'Error loading assign admin form',
            user: req.user,
        });
    }
};

/**
 * Render club dashboard
 * @param {Object} req Express request object
 * @param {Object} res Express response object
 */
const renderDashboard = async (req, res) => {
    try {
        const clubData = await clubService.getDashboardData(req.params.clubId);

        res.render('club-dashboard', {
            title: `وصل - لوحة تحكم ${clubData.name}`,
            HeaderOrSidebar: 'sidebar',
            extraCSS: '<link href="/css/club-dashboard.css" rel="stylesheet">',
            currentPage: 'club-dashboard',
            club: {
                ...clubData,
                clubAdmin: clubData.memberships[0]?.user || null,
                createdEvents: clubData.createdEvents.map((event) => ({
                    ...event,
                    eventStart: new Date(event.eventStart).toISOString(),
                    eventEnd: new Date(event.eventEnd).toISOString(),
                })),
            },
            error: null,
            user: req.user,
        });
    } catch (error) {
        console.error('Error in renderDashboard:', error);
        if (error.message === 'Club not found') {
            return res.status(404).render('error', {
                message: 'Club not found',
                user: req.user,
            });
        }
        res.status(500).render('error', {
            message: 'Error loading club dashboard',
            user: req.user,
        });
    }
};

module.exports = {
    getAllClubs,
    getClubById,
    renderCreateClubForm,
    createClub,
    renderEditClubForm,
    updateClub,
    renderAssignClubAdmin,
    assignClubAdmin,
    renderDashboard,
    joinClub,
};
