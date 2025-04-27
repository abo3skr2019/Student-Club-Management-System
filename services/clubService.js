const { db } = require('../dist/db');
const { club, user, clubMembership, event } = require('../dist/db/schema');
const { eq, and, sql, ilike } = require('drizzle-orm');
const {
    insertClubSchema,
    updateClubSchema,
} = require('../dist/db/schema/club');
const { ClubRole } = require('../dist/db/schema/user');

// Helper function for UUID validation
const isValidUUID = (uuid) => {
    const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
};

// Helper function for email validation
const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

/**
 * Get all clubs
 * @returns {Promise<Array>} Array of Club objects
 */
const getAllClubs = async () => {
    try {
        return await db.query.club.findMany({
            columns: {
                id: true,
                uuid: true,
                name: true,
                description: true,
                logo: true,
                createdAt: true,
                updatedAt: true,
            },
            with: {
                memberships: {
                    where: eq(clubMembership.role, ClubRole.CLUB_ADMIN),
                    with: {
                        user: {
                            columns: {
                                displayName: true,
                                email: true,
                            },
                        },
                    },
                },
            },
            orderBy: (clubs, { asc }) => [asc(clubs.name)],
        });
    } catch (error) {
        console.error('Error in getAllClubs:', error);
        throw error;
    }
};

/**
 * Find club by UUID
 * @param {String} uuid Club UUID
 * @returns {Promise<Object>} Club object
 */
const findByUUID = async (uuid) => {
    try {
        if (!isValidUUID(uuid)) {
            throw new Error('Invalid UUID format');
        }

        const clubData = await db.query.club.findFirst({
            where: eq(club.uuid, uuid),
            with: {
                memberships: {
                    with: {
                        user: {
                            columns: {
                                id: true,
                                displayName: true,
                                email: true,
                            },
                        },
                    },
                },
                createdEvents: {
                    columns: {
                        name: true,
                        description: true,
                        eventStart: true,
                        eventEnd: true,
                        status: true,
                        uuid: true,
                        poster: true,
                        category: true,
                        seatsAvailable: true,
                        seatsRemaining: true,
                    },
                    orderBy: (events, { asc }) => [asc(events.eventStart)],
                },
            },
        });

        if (!clubData) {
            throw new Error('Club not found');
        }

        // Get the admin membership for display
        const adminMembership = clubData.memberships.find(
            (m) => m.role === ClubRole.CLUB_ADMIN,
        );

        return {
            ...clubData,
            adminMembership, // Add this for display purposes
        };
    } catch (error) {
        console.error('Error in findByUUID:', error);
        throw error;
    }
};

/**
 * Create new club
 * @param {Object} clubData Pre-validated club data
 * @param {number} userId User ID of the creator
 * @returns {Promise<Object>} Created club
 */
const createClub = async (clubData, userId) => {
    try {
        const validatedData = insertClubSchema.parse(clubData);

        // Check if name already exists (case-insensitive)
        const existingClub = await db.query.club.findFirst({
            where: ilike(club.name, validatedData.name),
        });

        if (existingClub) {
            throw new Error('Club with this name already exists');
        }

        // Create club
        const [newClub] = await db
            .insert(club)
            .values(validatedData)
            .returning();

        // Create club membership for creator as admin
        await db.insert(clubMembership).values({
            clubId: newClub.id,
            userId: userId,
            role: ClubRole.CLUB_ADMIN,
        });

        return newClub;
    } catch (error) {
        console.error('Error in createClub:', error);
        throw error;
    }
};

/**
 * Update club
 * @param {String} clubId Club UUID
 * @param {Object} updateData Pre-validated update data
 * @returns {Promise<Object>} Updated club
 */
const updateClub = async (clubId, updateData) => {
    try {
        if (!isValidUUID(clubId)) {
            throw new Error('Invalid UUID format');
        }

        const validatedData = updateClubSchema.parse(updateData);
        const existingClub = await findByUUID(clubId);

        // Check if name already exists (case-insensitive)
        if (validatedData.name) {
            const existingClubWithName = await db.query.club.findFirst({
                where: and(
                    ilike(club.name, validatedData.name),
                    sql`${club.id} != ${existingClub.id}`,
                ),
            });

            if (existingClubWithName) {
                throw new Error('Club with this name already exists');
            }
        }

        const [updatedClub] = await db
            .update(club)
            .set(validatedData)
            .where(eq(club.uuid, clubId))
            .returning();

        if (!updatedClub) {
            throw new Error('Club not found');
        }

        return updatedClub;
    } catch (error) {
        console.error('Error in updateClub:', error);
        throw error;
    }
};

/**
 * Assign new club admin
 * @param {String} clubId Club UUID
 * @param {String} email New admin's email
 * @returns {Promise<Object>} Updated club
 */
const assignClubAdmin = async (clubId, email) => {
    try {
        if (!isValidUUID(clubId)) {
            throw new Error('Invalid UUID format');
        }

        if (!email || !isValidEmail(email)) {
            throw new Error('Invalid email format');
        }

        // Find the club and its current admin
        const clubData = await findByUUID(clubId);
        if (!clubData) {
            throw new Error('Club not found');
        }

        // Find the new admin by email
        const newAdminUser = await db.query.user.findFirst({
            where: eq(user.email, email),
        });

        if (!newAdminUser) {
            throw new Error('User not found');
        }

        // Check if new admin is already admin of this club
        const currentAdmin = await db.query.clubMembership.findFirst({
            where: and(
                eq(clubMembership.clubId, clubData.id),
                eq(clubMembership.role, ClubRole.CLUB_ADMIN),
            ),
        });

        if (currentAdmin?.userId === newAdminUser.id) {
            throw new Error('User is already an admin of this club');
        }

        // Update old admin's role to member if they exist
        if (currentAdmin) {
            await db
                .update(clubMembership)
                .set({ role: ClubRole.MEMBER })
                .where(eq(clubMembership.id, currentAdmin.id));
        }

        // Create or update new admin's membership
        const existingMembership = await db.query.clubMembership.findFirst({
            where: and(
                eq(clubMembership.clubId, clubData.id),
                eq(clubMembership.userId, newAdminUser.id),
            ),
        });

        if (existingMembership) {
            await db
                .update(clubMembership)
                .set({ role: ClubRole.CLUB_ADMIN })
                .where(eq(clubMembership.id, existingMembership.id));
        } else {
            await db.insert(clubMembership).values({
                clubId: clubData.id,
                userId: newAdminUser.id,
                role: ClubRole.CLUB_ADMIN,
            });
        }

        return await findByUUID(clubId);
    } catch (error) {
        console.error('Error in assignClubAdmin:', error);
        throw error;
    }
};

/**
 * Get club data for dashboard
 * @param {String} clubId Club UUID
 * @returns {Promise<Object>} Club data with events
 */
const getDashboardData = async (clubId) => {
    try {
        if (!isValidUUID(clubId)) {
            throw new Error('Invalid UUID format');
        }

        const clubData = await db.query.club.findFirst({
            where: eq(club.uuid, clubId),
            columns: {
                id: true,
                uuid: true,
                name: true,
                description: true,
                logo: true,
                createdAt: true,
                updatedAt: true,
            },
            with: {
                memberships: {
                    where: eq(clubMembership.role, ClubRole.CLUB_ADMIN),
                    with: {
                        user: {
                            columns: {
                                displayName: true,
                                email: true,
                            },
                        },
                    },
                },
                createdEvents: {
                    columns: {
                        name: true,
                        description: true,
                        eventStart: true,
                        eventEnd: true,
                        status: true,
                        uuid: true,
                        poster: true,
                        category: true,
                        seatsAvailable: true,
                        seatsRemaining: true,
                    },
                    orderBy: (events, { asc }) => [asc(events.eventStart)],
                },
            },
        });

        if (!clubData) {
            throw new Error('Club not found');
        }

        return clubData;
    } catch (error) {
        console.error('Error in getDashboardData:', error);
        throw error;
    }
};


const joinClub = async (clubId, userId) => {
    try {
        if (!isValidUUID(clubId)) {
            throw new Error('Invalid UUID format');
        }

        const clubData = await findByUUID(clubId);
        if (!clubData) {
            throw new Error('Club not found');
        }

        // Check if user is already a member
        const existingMembership = await db.query.clubMembership.findFirst({
            where: and(
                eq(clubMembership.clubId, clubData.id),
                eq(clubMembership.userId, userId),
            ),
        });

        if (existingMembership) {
            throw new Error('User is already a member of this club');
        }

        // Create membership
        await db.insert(clubMembership).values({
            clubId: clubData.id,
            userId: userId,
            role: ClubRole.MEMBER,
        });

        return await findByUUID(clubId);
    } catch (error) {
        console.error('Error in joinClub:', error);
        throw error;
    }
};
module.exports = {
    getAllClubs,
    findByUUID,
    createClub,
    updateClub,
    assignClubAdmin,
    getDashboardData,
    isValidUUID,
    joinClub,
};
