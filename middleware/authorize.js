/**
 * Authorization middleware for role-based access control
 * Provides factory functions to create middleware for checking global and club roles
 */
const createError = require('http-errors');
const { db } = require('../dist/db');
const { club, clubMembership } = require('../dist/db/schema');
const { eq, and, inArray } = require('drizzle-orm');
const {
    GlobalRole,
    ClubRole,
    MembershipStatus,
} = require('../dist/lib/constants');

/**
 * Middleware to authorize users by global or club roles.
 * Checks global roles first (fast, in-memory), then falls back to club role check (DB query).
 * @param {string[]} [allowedGlobalRoles=[]] - Permitted global roles (from GlobalRole enum)
 * @param {string[]} [allowedClubRoles=[]] - Permitted club roles (from ClubRole enum)
 * @returns {Function} Express middleware
 * @example
 * // For global role authorization only
 * authorize([GlobalRole.INMA_ADMIN], [])
 *
 * // For club role authorization only
 * authorize([], [ClubRole.CLUB_ADMIN])
 *
 * // For checking either global OR club role
 * authorize([GlobalRole.INMA_ADMIN], [ClubRole.CLUB_ADMIN])
 */
function authorize(allowedGlobalRoles = [], allowedClubRoles = []) {
    return (req, res, next) => {
        if (!req.user) {
            return next(createError(401, 'Authentication required'));
        }
        // First check if user has one of the allowed global roles
        if (allowedGlobalRoles.includes(req.user.globalRole)) {
            return next();
        }

        // If not, check for club role permissions
        if (allowedClubRoles.length > 0) {
            return requireClubRole(...allowedClubRoles)(req, res, next);
        }
        return next(createError(403, 'User does not have the required permissions'));
    };
}

/**
 * Creates middleware to verify user has an ACTIVE club membership with one of the allowed club roles
 * @param {...string} allowedClubRoles - Permitted club roles (from ClubRole enum)
 * @returns {Function} Express middleware
 */
function requireClubRole(...allowedClubRoles) {
    return async (req, res, next) => {
        try {
            if (!req.user) {
                return next(createError(401, 'Authentication required'));
            }

            const { clubUuid } = req.params;
            if (!clubUuid) {
                return next(createError(400, 'Missing club UUID parameter'));
            }

            // 1. Get the numeric club ID from UUID
            const clubRecord = await db.query.club.findFirst({
                where: eq(club.uuid, clubUuid),
                columns: { id: true },
            });
            if (!clubRecord) {
                return next(createError(404, 'Club not found'));
            }

            // 2. Find user's membership in this club with the required role and ACTIVE status
            const membership = await db.query.clubMembership.findFirst({
                where: and(
                    eq(clubMembership.clubId, clubRecord.id),
                    eq(clubMembership.userId, req.user.id),
                    eq(clubMembership.isArchived, false),
                    eq(clubMembership.status, MembershipStatus.ACTIVE),
                    // Check if the user's role is in the array of allowed roles
                    inArray(clubMembership.role, allowedClubRoles),
                ),
            });

            if (!membership) {
                return next(
                    createError(
                        403,
                        'You do not have the required role in this club',
                    ),
                );
            }

            next();
        } catch (err) {
            next(err);
        }
    };
}

module.exports = { authorize, requireClubRole };
