const { db } = require('../../dist/db');
const { club, clubMembership, event } = require('../../dist/db/schema');
const { eq, and } = require('drizzle-orm');
const { ClubRole } = require('../../dist/db/schema/user');

/**
 * Check if user is an admin
 * @param {Request} req - The request object
 * @param {Response} res - The response object
 * @param {Function} next - The next middleware function
 * @returns {void}
 */
const isAdmin = (req, res, next) => {
    if (req.user && req.user.globalRole === 'inmaAdmin') {
        return next();
    }
    res.status(403).render('error', {
        message: 'Admin access required',
        user: req.user,
    });
};

/**
 * Check if user is an admin of the club
 * @param {Request} req - The request object
 * @param {Response} res - The response object
 * @param {Function} next - The next middleware function
 * @returns {void}
 */
const isClubAdmin = async (req, res, next) => {
    try {
        // Check if user is authenticated
        if (!req.user) {
            return res.status(401).render('error', {
                message: 'Authentication required',
                user: req.user,
            });
        }

        // inmaAdmin can access everything
        if (req.user.globalRole === 'inmaAdmin') {
            return next();
        }

        let clubUuid = req.params.clubId;

        // If we're accessing through event route, get club ID from event
        if (req.params.eventId) {
            const eventData = await db.query.event.findFirst({
                where: eq(event.uuid, req.params.eventId),
                with: {
                    club: {
                        columns: {
                            uuid: true,
                        },
                    },
                },
            });
            if (!eventData) {
                return res.status(404).render('error', {
                    message: 'Event not found',
                    user: req.user,
                });
            }
            clubUuid = eventData.club.uuid;
        }

        // First get the club's numeric ID using UUID
        const clubData = await db.query.club.findFirst({
            where: eq(club.uuid, clubUuid),
            columns: { id: true },
        });

        if (!clubData) {
            return res.status(404).render('error', {
                message: 'Club not found',
                user: req.user,
            });
        }

        // Check if user is admin of this specific club using numeric ID
        const membership = await db.query.clubMembership.findFirst({
            where: and(
                eq(clubMembership.userId, req.user.id),
                eq(clubMembership.clubId, clubData.id),
                eq(clubMembership.role, ClubRole.CLUB_ADMIN),
            ),
        });

        if (!membership) {
            return res.status(403).render('error', {
                message: 'Club admin access required',
                user: req.user,
            });
        }

        next();
    } catch (error) {
        next(error);
    }
};

module.exports = { isAdmin, isClubAdmin };
