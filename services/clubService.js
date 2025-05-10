const { db } = require('../dist/db');
const { club, clubMembership, task } = require('../dist/db/schema');
const { eq, and, or, count, sql, inArray } = require('drizzle-orm');
const { ClubRole, MembershipStatus } = require('../dist/lib/constants');
const { buildFilterConditions } = require('../utils/queryFilterBuilder');
const { buildSelectFields } = require('../utils/queryFieldSelector');
const {
    insertClubSchema,
    updateClubSchema,
} = require('../dist/db/schema/club');
const {
    insertClubMembershipSchema,
    updateClubMembershipSchema,
} = require('../dist/db/schema/clubMembership');
const { user } = require('../dist/db/schema');
const createError = require('http-errors');

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
 * Get all clubs with pagination and sorting
 * @param {Object} params Query parameters
 * @param {Object} params.pagination Pagination options (from QueryParser)
 * @param {Object} params.sort Sorting options (from QueryParser)
 * @param {string} params.search Search term (from QueryParser)
 * @param {Object} params.filters Filter conditions (from QueryParser)
 * @param {Array} params.fields Fields to select (from QueryParser)
 * @returns {Promise<Object>} Paginated clubs with metadata
 */
const getAllClubs = async (params = {}) => {
    // Extract pagination, sort, search, filters, and fields - QueryParser already provides defaults
    const {
        pagination = {},
        sort = {},
        search,
        filters = {},
        fields = [],
    } = params;
    const { page = 1, limit = 10 } = pagination;

    // Calculate offset
    const offset = (page - 1) * limit;

    // Build where conditions - start with not archived
    let whereConditions = [eq(club.isArchived, false)];

    // Add search condition if provided
    if (search) {
        // Search across both name and description fields with case-insensitive matching
        whereConditions.push(
            or(
                sql`LOWER(${club.name}) LIKE ${`%${search.toLowerCase()}%`}`,
                sql`LOWER(${club.description}) LIKE ${`%${search.toLowerCase()}%`}`,
            ),
        );
    }

    // Add filter conditions if provided
    whereConditions.push(...buildFilterConditions(filters, club));

    // Combine conditions with AND
    const whereClause = and(...whereConditions);

    // Get total count for pagination
    const [countResult] = await db
        .select({ value: count() })
        .from(club)
        .where(whereClause);

    const total = countResult?.value || 0;

    // Build columns object for field selection
    const columns = buildSelectFields(fields, club);

    // Get paginated clubs
    const clubs = await db.query.club.findMany({
        where: whereClause,
        columns,
        limit: limit,
        offset: offset,
        orderBy: (c, { asc, desc }) => {
            const entries = Object.entries(sort);
            if (entries.length) {
                return entries.map(([field, dir]) =>
                    dir === 'desc' ? desc(c[field]) : asc(c[field]),
                );
            }
            // Default sort by name ascending
            return [asc(c.name)];
        },
    });

    // Calculate pagination metadata
    const totalPages = Math.ceil(total / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;

    return {
        items: clubs,
        pagination: {
            page,
            limit,
            total,
            totalPages,
            hasNext,
            hasPrev,
        },
    };
};

/**
 * Find club by UUID
 * @param {string} uuid Club UUID
 * @param {Object} [params] Query parameters
 * @param {Array} [params.fields] Fields to select
 * @returns {Promise<Object>} Club data
 */
const findByUUID = async (uuid, params = {}) => {
    const { fields = [] } = params;

    if (!isValidUUID(uuid)) {
        throw createError(400, 'Invalid UUID format');
    }

    const columns = buildSelectFields(fields, club);

    const clubData = await db.query.club.findFirst({
        where: and(eq(club.uuid, uuid), eq(club.isArchived, false)),
        columns,
    });

    if (!clubData) {
        throw createError(404, 'Club not found');
    }

    return clubData;
};

/**
 * Create new club
 * @param {Object} data Club data
 * @param {number} userId User ID creating the club
 * @returns {Promise<Object>} Created club
 */
const createClub = async (data, userId) => {
    // Add userId data
    const clubData = {
        ...data,
        createdBy: userId,
        updatedBy: userId,
    };

    // Check if name already exists (case-insensitive)
    const nameLower = clubData.name.trim().toLowerCase();
    const existingClub = await db.query.club.findFirst({
        where: sql`
            LOWER(${club.name}) = ${nameLower}
            AND ${club.isArchived} = false
        `,
    });

    if (existingClub) {
        throw createError(409, 'Club with this name already exists');
    }

    const [newClub] = await db.insert(club).values(clubData).returning();

    return newClub;
};

/**
 * Update club
 * @param {string} uuid Club UUID
 * @param {Object} data Update data
 * @param {number} userId User ID updating the club
 * @returns {Promise<Object>} Updated club
 */
const updateClub = async (uuid, data, userId) => {
    if (!isValidUUID(uuid)) {
        throw createError(400, 'Invalid UUID format');
    }

    // Check if name already exists (case-insensitive)
    if (data.name) {
        const nameLower = data.name.trim().toLowerCase();
        const existingClub = await db.query.club.findFirst({
            where: sql`
                LOWER(${club.name}) = ${nameLower}
                AND ${club.isArchived} = false
                AND ${club.uuid} != ${uuid}
            `,
        });

        if (existingClub) {
            throw createError(409, 'Club with this name already exists');
        }
    }

    const [updatedClub] = await db
        .update(club)
        .set({
            ...data,
            updatedBy: userId,
            updatedAt: new Date(),
        })
        .where(eq(club.uuid, uuid))
        .returning();

    if (!updatedClub) {
        throw createError(404, 'Club not found');
    }

    return updatedClub;
};

/**
 * Delete club
 * @param {string} uuid Club UUID
 * @param {number} userId User ID
 * @returns {Promise<Object>} Archived club
 */
const deleteClub = async (uuid, userId) => {
    if (!isValidUUID(uuid)) {
        throw createError(400, 'Invalid UUID format');
    }

    // Soft delete by setting isArchived and archivedAt
    const [archivedClub] = await db
        .update(club)
        .set({
            isArchived: true,
            archivedAt: new Date(),
            updatedBy: userId,
            updatedAt: new Date(),
        })
        .where(eq(club.uuid, uuid))
        .returning();

    if (!archivedClub) {
        throw createError(404, 'Club not found');
    }

    return archivedClub;
};

/**
 * Get all memberships for a club
 * @param {string} clubUuid Club UUID
 * @param {Object} params Query parameters
 * @param {Object} params.pagination Pagination options (from QueryParser)
 * @param {Object} params.sort Sorting options (from QueryParser)
 * @param {string} params.search Search term (from QueryParser)
 * @param {Object} params.filters Filter conditions (from QueryParser)
 * @param {Array} params.fields Fields to select (from QueryParser)
 * @returns {Promise<Object>} Paginated memberships with metadata
 */
const getAllClubMemberships = async (clubUuid, params = {}) => {
    if (!isValidUUID(clubUuid)) {
        throw createError(400, 'Invalid UUID format');
    }

    const clubData = await findByUUID(clubUuid);

    // Extract pagination, sort, search, filters, and fields - QueryParser already provides defaults
    const {
        pagination = {},
        sort = {},
        search,
        filters = {},
        fields = [],
    } = params;
    const { page = 1, limit = 10 } = pagination;

    // Calculate offset
    const offset = (page - 1) * limit;

    // Build base where conditions
    const whereConditions = [
        eq(clubMembership.clubId, clubData.id),
        eq(clubMembership.isArchived, false),
    ];

    // If search is provided, find matching user IDs with prefix search
    if (search) {
        // Create a prefix search term (starts with the search term)
        const term = `${search.toLowerCase()}%`;

        // Find users whose firstName OR lastName starts with the term
        const matchedUsers = await db
            .select({ id: user.id })
            .from(user)
            .where(
                or(
                    sql`LOWER(${user.firstName}) LIKE ${term}`,
                    sql`LOWER(${user.lastName}) LIKE ${term}`,
                ),
            );

        const userIds = matchedUsers.map((u) => u.id);

        // Only add to filter if we found matching users
        if (userIds.length > 0) {
            whereConditions.push(inArray(clubMembership.userId, userIds));
        }
    }

    // Add filter conditions if provided
    whereConditions.push(...buildFilterConditions(filters, clubMembership));

    // Combine all conditions with AND
    const whereClause = and(...whereConditions);

    // Get total count for pagination
    const [countResult] = await db
        .select({ value: count() })
        .from(clubMembership)
        .where(whereClause);

    const total = countResult?.value || 0;

    // Build columns object for field selection
    const columns = buildSelectFields(fields, clubMembership);

    // Get paginated memberships
    const memberships = await db.query.clubMembership.findMany({
        where: whereClause,
        columns,
        with: {
            user: true,
        },
        limit: limit,
        offset: offset,
        orderBy: (m, { asc, desc }) => {
            const entries = Object.entries(sort);
            if (entries.length) {
                return entries.map(([field, dir]) =>
                    dir === 'desc' ? desc(m[field]) : asc(m[field]),
                );
            }
            // Default sort by updatedAt descending (newest first)
            return [desc(m.joinedAt)];
        },
    });

    // Calculate pagination metadata
    const totalPages = Math.ceil(total / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;

    return {
        items: memberships,
        pagination: {
            page,
            limit,
            total,
            totalPages,
            hasNext,
            hasPrev,
        },
    };
};

/**
 * Get membership by UUID
 * @param {string} uuid Membership UUID
 * @param {Object} [params] Query parameters
 * @param {Array} [params.fields] Fields to select
 * @returns {Promise<Object>} Membership data
 */
const getMembershipByUUID = async (uuid, params = {}) => {
    const { fields = [] } = params;

    if (!isValidUUID(uuid)) {
        throw createError(400, 'Invalid UUID format');
    }

    const columns = buildSelectFields(fields, clubMembership);

    const membership = await db.query.clubMembership.findFirst({
        where: and(
            eq(clubMembership.uuid, uuid),
            eq(clubMembership.isArchived, false),
        ),
        columns,
        with: {
            user: true,
            club: {
                where: eq(club.isArchived, false),
            },
        },
    });

    if (!membership) {
        throw createError(404, 'Membership not found');
    }

    return membership;
};

/**
 * Create membership
 * @param {string} clubUuid Club UUID
 * @param {Object} data Object containing user email
 * @param {number} userId User ID creating the membership
 * @returns {Promise<Object>} Created membership
 */
const createMembership = async (clubUuid, data, userId) => {
    if (!isValidUUID(clubUuid)) {
        throw createError(400, 'Invalid UUID format');
    }

    if (!data.email || !isValidEmail(data.email)) {
        throw createError(400, 'Valid email is required');
    }

    // Find the user by email
    const userToAdd = await db.query.user.findFirst({
        where: eq(user.email, data.email),
    });

    if (!userToAdd) {
        throw createError(404, 'User not found with the provided email');
    }

    const clubData = await findByUUID(clubUuid);

    // Check if user is already a member
    const existingMembership = await db.query.clubMembership.findFirst({
        where: and(
            eq(clubMembership.clubId, clubData.id),
            eq(clubMembership.userId, userToAdd.id),
            eq(clubMembership.isArchived, false),
        ),
    });

    if (existingMembership) {
        // If they already applied, approve their pending application
        if (existingMembership.status === MembershipStatus.PENDING) {
            const updateData = {
                status: MembershipStatus.ACTIVE,
                joinedAt: new Date(),
                updatedBy: userId,
            };

            // Apply any custom fields if provided
            if (data.role) updateData.role = data.role;
            if (data.tag) updateData.tag = data.tag;

            const [approvedMembership] = await db
                .update(clubMembership)
                .set(updateData)
                .where(eq(clubMembership.uuid, existingMembership.uuid))
                .returning();

            return approvedMembership;
        }

        // Otherwise, give custom error messages for other statuses
        switch (existingMembership.status) {
            case MembershipStatus.ACTIVE:
                throw createError(
                    409,
                    'User is already an active member of this club',
                );
            case MembershipStatus.INACTIVE:
                throw createError(
                    409,
                    'User previously left this club and is now inactive. Please delete their old membership or reactivate it instead.',
                );
            case MembershipStatus.DENIED:
                throw createError(
                    409,
                    'User was previously denied membership to this club',
                );
            default:
                throw createError(
                    409,
                    'User already has a membership record for this club',
                );
        }
    }

    // Initialize membership with default values
    const membershipData = {
        clubId: clubData.id,
        userId: userToAdd.id,
        role: ClubRole.MEMBER,
        status: MembershipStatus.ACTIVE, // Active by default for directly added members
        submittingErrors: 0,
        createdBy: userId,
        updatedBy: userId,
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    // Add any custom fields if provided
    if (data.role) membershipData.role = data.role;
    if (data.tag) membershipData.tag = data.tag;

    const [membership] = await db
        .insert(clubMembership)
        .values(membershipData)
        .returning();

    return membership;
};

/**
 * Update membership
 * @param {string} uuid Membership UUID
 * @param {Object} data Update data
 * @param {number} userId User ID updating the membership
 * @returns {Promise<Object>} Updated membership
 */
const updateMembership = async (uuid, data, userId) => {
    if (!isValidUUID(uuid)) {
        throw createError(400, 'Invalid UUID format');
    }

    // Fetch existing membership to check status
    const existingMembership = await db.query.clubMembership.findFirst({
        where: eq(clubMembership.uuid, uuid),
    });

    if (!existingMembership) {
        throw createError(404, 'Membership not found');
    }

    // Build update object
    const updateData = {
        ...data,
        updatedBy: userId,
    };

    // Only set joinedAt if status is changing from non-active to active
    if (
        data.status === MembershipStatus.ACTIVE &&
        existingMembership.status !== MembershipStatus.ACTIVE
    ) {
        updateData.joinedAt = new Date();
    }

    const [updatedMembership] = await db
        .update(clubMembership)
        .set(updateData)
        .where(eq(clubMembership.uuid, uuid))
        .returning();

    return updatedMembership;
};

/**
 * Join club
 * @param {string} clubUuid Club UUID
 * @param {number} userId User ID
 * @returns {Promise<Object>} Created membership
 */
const joinClub = async (clubUuid, userId) => {
    if (!isValidUUID(clubUuid)) {
        throw createError(400, 'Invalid UUID format');
    }

    const clubData = await findByUUID(clubUuid);

    // Check if user is already a member
    const existingMembership = await db.query.clubMembership.findFirst({
        where: and(
            eq(clubMembership.clubId, clubData.id),
            eq(clubMembership.userId, userId),
            eq(clubMembership.isArchived, false),
        ),
    });

    if (existingMembership) {
        // Provide more specific error messages based on membership status
        switch (existingMembership.status) {
            case MembershipStatus.PENDING:
                throw createError(
                    409,
                    'Your application to join this club is already pending approval',
                );
            case MembershipStatus.ACTIVE:
                throw createError(
                    409,
                    'You are already an active member of this club',
                );
            case MembershipStatus.INACTIVE:
                throw createError(
                    409,
                    'You previously left this club. Please wait for the next membership cycle or contact a club administrator',
                );
            case MembershipStatus.DENIED:
                throw createError(
                    409,
                    'Your previous application was denied. Please contact a club administrator',
                );
            default:
                throw createError(
                    409,
                    'You already have a membership record for this club',
                );
        }
    }

    const [membership] = await db
        .insert(clubMembership)
        .values({
            clubId: clubData.id,
            userId,
            role: ClubRole.MEMBER,
            status: MembershipStatus.PENDING,
            createdBy: userId,
            updatedBy: userId,
            createdAt: new Date(),
            updatedAt: new Date(),
        })
        .returning();

    return membership;
};

/**
 * Leave club
 * @param {string} clubUuid Club UUID
 * @param {number} userId User ID
 * @returns {Promise<Object>} Updated membership with inactive status
 */
const leaveClub = async (clubUuid, userId) => {
    if (!isValidUUID(clubUuid)) {
        throw createError(400, 'Invalid UUID format');
    }

    const clubData = await findByUUID(clubUuid);

    // Find the membership
    const membership = await db.query.clubMembership.findFirst({
        where: and(
            eq(clubMembership.clubId, clubData.id),
            eq(clubMembership.userId, userId),
            eq(clubMembership.isArchived, false),
        ),
    });

    if (!membership) {
        throw createError(404, 'Membership not found');
    }

    // Check if this is a club admin and if they're the last one
    if (membership.role === ClubRole.CLUB_ADMIN) {
        // Count active club admins
        const [result] = await db
            .select({ count: count() })
            .from(clubMembership)
            .where(
                and(
                    eq(clubMembership.clubId, clubData.id),
                    eq(clubMembership.role, ClubRole.CLUB_ADMIN),
                    eq(clubMembership.status, MembershipStatus.ACTIVE),
                    eq(clubMembership.isArchived, false),
                ),
            );

        // If this is the last club admin, prevent leaving
        if (Number(result.count) === 1) {
            throw createError(
                400,
                'Cannot leave club as you are the last admin. Please assign another admin first.',
            );
        }
    }

    // Update membership to inactive
    const [updatedMembership] = await db
        .update(clubMembership)
        .set({
            status: MembershipStatus.INACTIVE,
            updatedBy: userId,
        })
        .where(eq(clubMembership.uuid, membership.uuid))
        .returning();

    return updatedMembership;
};

/**
 * Delete membership
 * @param {string} uuid Membership UUID
 * @param {number} userId User ID performing the delete
 * @returns {Promise<Object>} Archived membership
 */
const deleteMembership = async (uuid, userId) => {
    if (!isValidUUID(uuid)) {
        throw createError(400, 'Invalid UUID format');
    }

    // First get the membership to check role
    const membership = await db.query.clubMembership.findFirst({
        where: eq(clubMembership.uuid, uuid),
    });

    if (!membership) {
        throw createError(404, 'Membership not found');
    }

    // Check if this is a club admin and if they're the last one
    if (membership.role === ClubRole.CLUB_ADMIN) {
        // Count active club admins
        const [result] = await db
            .select({ count: count() })
            .from(clubMembership)
            .where(
                and(
                    eq(clubMembership.clubId, membership.clubId),
                    eq(clubMembership.role, ClubRole.CLUB_ADMIN),
                    eq(clubMembership.status, MembershipStatus.ACTIVE),
                    eq(clubMembership.isArchived, false),
                ),
            );

        // If this is the last club admin, prevent deletion
        if (Number(result.count) === 1) {
            throw createError(
                400,
                'Cannot delete the last club admin. Please assign another admin first.',
            );
        }
    }

    // Soft delete by setting isArchived and archivedAt
    const [archivedMembership] = await db
        .update(clubMembership)
        .set({
            isArchived: true,
            archivedAt: new Date(),
            updatedBy: userId,
        })
        .where(eq(clubMembership.uuid, uuid))
        .returning();

    return archivedMembership;
};

/**
 * Reset club term - archives inactive/denied memberships and ALL tasks for the club
 * @param {string} clubUuid Club UUID
 * @param {number} userId User ID performing the reset
 * @returns {Promise<Object>} Result with counts of archived entities
 */
const resetClubTerm = async (clubUuid, userId) => {
    if (!isValidUUID(clubUuid)) {
        throw createError(400, 'Invalid UUID format');
    }

    const clubData = await findByUUID(clubUuid);

    // 1. Archive inactive and denied memberships
    const archivedMemberships = await db
        .update(clubMembership)
        .set({
            isArchived: true,
            archivedAt: new Date(),
            updatedBy: userId,
        })
        .where(
            and(
                eq(clubMembership.clubId, clubData.id),
                eq(clubMembership.isArchived, false),
                or(
                    eq(clubMembership.status, MembershipStatus.INACTIVE),
                    eq(clubMembership.status, MembershipStatus.DENIED),
                ),
            ),
        )
        .returning();

    // 2. Get ALL membership IDs for this club (to archive ALL tasks)
    const allMemberships = await db.query.clubMembership.findMany({
        where: eq(clubMembership.clubId, clubData.id),
        columns: {
            id: true,
        },
    });

    const membershipIds = allMemberships.map((m) => m.id);

    // 3. Archive ALL tasks for ALL memberships in this club (even active ones)
    const archivedTasks =
        membershipIds.length > 0
            ? await db
                  .update(task)
                  .set({
                      isArchived: true,
                      archivedAt: new Date(),
                      updatedBy: userId,
                  })
                  .where(
                      and(
                          eq(task.isArchived, false),
                          inArray(task.clubMembershipId, membershipIds),
                      ),
                  )
                  .returning()
            : [];

    return {
        archivedMembershipCount: archivedMemberships.length,
        archivedTaskCount: archivedTasks.length,
        archivedMemberships,
        archivedTasks,
    };
};

module.exports = {
    getAllClubs,
    findByUUID,
    createClub,
    updateClub,
    deleteClub,
    getAllClubMemberships,
    getMembershipByUUID,
    createMembership,
    updateMembership,
    joinClub,
    leaveClub,
    deleteMembership,
    resetClubTerm,
};
