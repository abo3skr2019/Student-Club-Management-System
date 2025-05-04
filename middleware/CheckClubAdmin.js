const { db } = require('../dist/db');
const { club, clubMembership } = require('../dist/db/schema');
const { eq, and } = require('drizzle-orm');
const { ClubRole } = require('../dist/db/schema/user');

/**
 * Middleware to check if the user is a Club Admin and attach club UUID to req.user
 * @param {Request} req - The request object
 * @param {Response} res - The response object
 * @param {Function} next - The next middleware function
 * @returns {void}
 */
const checkClubAdmin = async (req, res, next) => {
    if (req.user) {
        try {
            // Find any clubs where user is admin
            const adminMembership = await db.query.clubMembership.findFirst({
                where: and(
                    eq(clubMembership.userId, req.user.id),
                    eq(clubMembership.role, ClubRole.CLUB_ADMIN),
                ),
                with: {
                    club: {
                        columns: {
                            uuid: true,
                        },
                    },
                },
            });

            if (adminMembership) {
                req.user.clubUUID = adminMembership.club.uuid;
            }
        } catch (err) {
            console.error('Error fetching club UUID:', err);
        }
    }
    res.locals.user = req.user || null;
    next();
};

module.exports = { checkClubAdmin };
