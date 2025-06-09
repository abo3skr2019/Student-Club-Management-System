const { db } = require('../dist/db');
const { task, clubMembership, club, user } = require('../dist/db/schema');
const { eq, and, or, count, sql, inArray } = require('drizzle-orm');
const { buildFilterConditions } = require('../utils/queryFilterBuilder');
const { buildSelectFields } = require('../utils/queryFieldSelector');
const createError = require('http-errors');

const isValidUUID = (uuid) => {
    const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
};

const getAllTasks = async (params = {}) => {
    const {
        pagination = {},
        sort = {},
        search,
        filters = {},
        fields = [],
        currentUserId = null
    } = params;
    const { page = 1, limit = 10 } = pagination;

    // Calculate offset
    const offset = (page - 1) * limit;

    // Build where conditions - always filter out archived tasks
    let whereConditions = [eq(task.isArchived, false)];

    // Filter by current user if requested
    if (currentUserId) {
        whereConditions.push(eq(task.createdBy, currentUserId));
    }

    // Add search condition if provided (search in title and description)
    if (search) {
        whereConditions.push(
            or(
                sql`LOWER(${task.title}) LIKE ${`%${search.toLowerCase()}%`}`,
                sql`LOWER(${task.description}) LIKE ${`%${search.toLowerCase()}%`}`,
            ),
        );
    }

    // Add filter conditions
    whereConditions.push(...buildFilterConditions(filters, task));

    // Combine conditions with AND
    const whereClause = and(...whereConditions);

    // Get total count for pagination
    const [countResult] = await db
        .select({ value: count() })
        .from(task)
        .where(whereClause);

    const total = countResult?.value || 0;

    // Build columns object for field selection
    const columns = buildSelectFields(fields, task);

    // Get paginated tasks
    const tasks = await db.query.task.findMany({
        where: whereClause,
        columns,
        with: {
            clubMembership: {
                with: {
                    user: true,
                    club: true
                }
            },
            createdByUser: true,
            updatedByUser: true
        },
        limit: limit,
        offset: offset,
        orderBy: (t, { asc, desc }) => {
            const entries = Object.entries(sort);
            if (entries.length) {
                return entries.map(([field, dir]) =>
                    dir === 'desc' ? desc(t[field]) : asc(t[field]),
                );
            }
            // Default sort by createdAt descending
            return [desc(t.createdAt)];
        },
    });

    // Calculate pagination metadata
    const totalPages = Math.ceil(total / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;

    return {
        items: tasks,
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

const getAllTasksForUser = async (userUuid, params = {}) => {
    const {
        pagination = {},
        sort = {},
        search,
        filters = {},
        fields = []
    } = params;
    const { page = 1, limit = 10 } = pagination;

    // Validate user UUID
    if (!isValidUUID(userUuid)) {
        throw createError(400, 'Invalid user UUID format');
    }

    // First, find the user to make sure they exist
    const targetUser = await db.query.user.findFirst({
        where: eq(user.uuid, userUuid)
    });

    if (!targetUser) {
        throw createError(404, 'User not found');
    }

    // Calculate offset
    const offset = (page - 1) * limit;

    // Build where conditions - filter out archived tasks and filter by user
    let whereConditions = [
        eq(task.isArchived, false),
        eq(task.createdBy, targetUser.id)
    ];

    // Add search condition if provided (search in title and description)
    if (search) {
        whereConditions.push(
            or(
                sql`LOWER(${task.title}) LIKE ${`%${search.toLowerCase()}%`}`,
                sql`LOWER(${task.description}) LIKE ${`%${search.toLowerCase()}%`}`,
            ),
        );
    }

    // Add filter conditions
    whereConditions.push(...buildFilterConditions(filters, task));

    // Combine conditions with AND
    const whereClause = and(...whereConditions);

    // Get total count for pagination
    const [countResult] = await db
        .select({ value: count() })
        .from(task)
        .where(whereClause);

    const total = countResult?.value || 0;

    // Build columns object for field selection
    const columns = buildSelectFields(fields, task);

    // Get paginated tasks
    const tasks = await db.query.task.findMany({
        where: whereClause,
        columns,
        with: {
            clubMembership: {
                with: {
                    user: true,
                    club: true
                }
            },
            createdByUser: true,
            updatedByUser: true
        },
        limit: limit,
        offset: offset,
        orderBy: (t, { asc, desc }) => {
            const entries = Object.entries(sort);
            if (entries.length) {
                return entries.map(([field, dir]) =>
                    dir === 'desc' ? desc(t[field]) : asc(t[field]),
                );
            }
            // Default sort by createdAt descending
            return [desc(t.createdAt)];
        },
    });

    // Calculate pagination metadata
    const totalPages = Math.ceil(total / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;

    return {
        items: tasks,
        userUuid,
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

const getAllTasksForClub = async (clubUuid, params = {}) => {
    const {
        pagination = {},
        sort = {},
        search,
        filters = {},
        fields = []
    } = params;
    const { page = 1, limit = 10 } = pagination;

    if (!isValidUUID(clubUuid)) {
        throw createError(400, 'Invalid club UUID format');
    }

    // First, find the club to make sure it exists
    const targetClub = await db.query.club.findFirst({
        where: and(
            eq(club.uuid, clubUuid),
            eq(club.isArchived, false)
        )
    });

    if (!targetClub) {
        throw createError(404, 'Club not found');
    }

    // Get all membership IDs for this club
    const memberships = await db.query.clubMembership.findMany({
        where: and(
            eq(clubMembership.clubId, targetClub.id),
            eq(clubMembership.isArchived, false)
        ),
        columns: {
            id: true
        }
    });

    const membershipIds = memberships.map(m => m.id);

    // Calculate offset
    const offset = (page - 1) * limit;

    // Build where conditions - filter out archived tasks and filter by club memberships
    let whereConditions = [
        eq(task.isArchived, false)
    ];

    // Only add membership filter if there are memberships
    if (membershipIds.length > 0) {
        whereConditions.push(inArray(task.clubMembershipId, membershipIds));
    } else {
        // If no memberships, return empty result
        return {
            items: [],
            clubUuid,
            pagination: {
                page,
                limit,
                total: 0,
                totalPages: 0,
                hasNext: false,
                hasPrev: false,
            },
        };
    }

    // Add search condition if provided (search in title and description)
    if (search) {
        whereConditions.push(
            or(
                sql`LOWER(${task.title}) LIKE ${`%${search.toLowerCase()}%`}`,
                sql`LOWER(${task.description}) LIKE ${`%${search.toLowerCase()}%`}`,
            ),
        );
    }

    // Add filter conditions
    whereConditions.push(...buildFilterConditions(filters, task));

    // Combine conditions with AND
    const whereClause = and(...whereConditions);

    // Get total count for pagination
    const [countResult] = await db
        .select({ value: count() })
        .from(task)
        .where(whereClause);

    const total = countResult?.value || 0;

    // Build columns object for field selection
    const columns = buildSelectFields(fields, task);

    // Get paginated tasks
    const tasks = await db.query.task.findMany({
        where: whereClause,
        columns,
        with: {
            clubMembership: {
                with: {
                    user: true,
                    club: true
                }
            },
            createdByUser: true,
            updatedByUser: true
        },
        limit: limit,
        offset: offset,
        orderBy: (t, { asc, desc }) => {
            const entries = Object.entries(sort);
            if (entries.length) {
                return entries.map(([field, dir]) =>
                    dir === 'desc' ? desc(t[field]) : asc(t[field]),
                );
            }
            // Default sort by createdAt descending
            return [desc(t.createdAt)];
        },
    });

    // Calculate pagination metadata
    const totalPages = Math.ceil(total / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;

    return {
        items: tasks,
        clubUuid,
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

const getAllTasksForMembership = async (membershipUuid, params = {}) => {
    const {
        pagination = {},
        sort = {},
        search,
        filters = {},
        fields = []
    } = params;
    const { page = 1, limit = 10 } = pagination;

    // Validate membership UUID
    if (!isValidUUID(membershipUuid)) {
        throw createError(400, 'Invalid membership UUID format');
    }

    // First, find the membership to make sure it exists
    const targetMembership = await db.query.clubMembership.findFirst({
        where: and(
            eq(clubMembership.uuid, membershipUuid),
            eq(clubMembership.isArchived, false)
        )
    });

    if (!targetMembership) {
        throw createError(404, 'Membership not found');
    }

    // Calculate offset
    const offset = (page - 1) * limit;

    // Build where conditions - filter out archived tasks and filter by membership
    let whereConditions = [
        eq(task.isArchived, false),
        eq(task.clubMembershipId, targetMembership.id)
    ];

    // Add search condition if provided (search in title and description)
    if (search) {
        whereConditions.push(
            or(
                sql`LOWER(${task.title}) LIKE ${`%${search.toLowerCase()}%`}`,
                sql`LOWER(${task.description}) LIKE ${`%${search.toLowerCase()}%`}`,
            ),
        );
    }

    // Add filter conditions
    whereConditions.push(...buildFilterConditions(filters, task));

    // Combine conditions with AND
    const whereClause = and(...whereConditions);

    // Get total count for pagination
    const [countResult] = await db
        .select({ value: count() })
        .from(task)
        .where(whereClause);

    const total = countResult?.value || 0;

    // Build columns object for field selection
    const columns = buildSelectFields(fields, task);

    // Get paginated tasks
    const tasks = await db.query.task.findMany({
        where: whereClause,
        columns,
        with: {
            clubMembership: {
                with: {
                    user: true,
                    club: true
                }
            },
            createdByUser: true,
            updatedByUser: true
        },
        limit: limit,
        offset: offset,
        orderBy: (t, { asc, desc }) => {
            const entries = Object.entries(sort);
            if (entries.length) {
                return entries.map(([field, dir]) =>
                    dir === 'desc' ? desc(t[field]) : asc(t[field]),
                );
            }
            // Default sort by createdAt descending
            return [desc(t.createdAt)];
        },
    });

    // Calculate pagination metadata
    const totalPages = Math.ceil(total / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;

    return {
        items: tasks,
        membershipUuid,
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

const findTaskById = async (taskId, params = {}) => {
    const { fields = [] } = params;

    let whereClause;
    
    // Check if it's a UUID
    if (isValidUUID(taskId)) {
        whereClause = and(
            eq(task.uuid, taskId),
            eq(task.isArchived, false)
        );
    } else {
        // Try numeric ID
        const numericId = parseInt(taskId);
        if (isNaN(numericId)) {
            throw createError(400, 'Invalid task ID format');
        }
        whereClause = and(
            eq(task.id, numericId),
            eq(task.isArchived, false)
        );
    }

    const columns = buildSelectFields(fields, task);

    const taskData = await db.query.task.findFirst({
        where: whereClause,
        columns,
        with: {
            clubMembership: {
                with: {
                    user: true,
                    club: true
                }
            },
            createdByUser: true,
            updatedByUser: true
        }
    });

    if (!taskData) {
        throw createError(404, 'Task not found');
    }

    return taskData;
};

const createTask = async (data, userId) => {
    // Verify the club membership exists and belongs to the user
    const membership = await db.query.clubMembership.findFirst({
        where: and(
            eq(clubMembership.id, data.clubMembershipId),
            eq(clubMembership.userId, userId),
            eq(clubMembership.isArchived, false)
        )
    });

    if (!membership) {
        throw createError(403, 'Invalid club membership or insufficient permissions');
    }

    // Add metadata
    const taskData = {
        ...data,
        createdBy: userId,
        updatedBy: userId,
    };

    const [newTask] = await db.insert(task).values(taskData).returning();

    return newTask;
};

const updateTask = async (taskId, data, userId) => {
    // Find the task first
    const existingTask = await findTaskById(taskId);

    // Check permissions - user must be the task creator or have appropriate role
    const membership = await db.query.clubMembership.findFirst({
        where: eq(clubMembership.id, existingTask.clubMembershipId),
        with: {
            club: true
        }
    });

    if (!membership) {
        throw createError(404, 'Associated membership not found');
    }

    // Check if user is authorized to update
    const isTaskOwner = existingTask.createdBy === userId;
    const isClubAdmin = await db.query.clubMembership.findFirst({
        where: and(
            eq(clubMembership.clubId, membership.club.id),
            eq(clubMembership.userId, userId),
            inArray(clubMembership.role, ['clubAdmin', 'hr']),
            eq(clubMembership.isArchived, false)
        )
    });

    if (!isTaskOwner && !isClubAdmin) {
        throw createError(403, 'Insufficient permissions to update this task');
    }

    // Update the task
    const [updatedTask] = await db
        .update(task)
        .set({
            ...data,
            updatedBy: userId,
            updatedAt: new Date(),
        })
        .where(eq(task.id, existingTask.id))
        .returning();

    return updatedTask;
};

/**
 * Delete task (soft delete)
 */
const deleteTask = async (taskId, userId) => {
    // Find the task first
    const existingTask = await findTaskById(taskId);

    // Check permissions - user must be the task creator or have appropriate role
    const membership = await db.query.clubMembership.findFirst({
        where: eq(clubMembership.id, existingTask.clubMembershipId),
        with: {
            club: true
        }
    });

    if (!membership) {
        throw createError(404, 'Associated membership not found');
    }

    // Check if user is authorized to delete
    const isTaskOwner = existingTask.createdBy === userId;
    const isClubAdmin = await db.query.clubMembership.findFirst({
        where: and(
            eq(clubMembership.clubId, membership.club.id),
            eq(clubMembership.userId, userId),
            inArray(clubMembership.role, ['clubAdmin', 'hr']),
            eq(clubMembership.isArchived, false)
        )
    });

    if (!isTaskOwner && !isClubAdmin) {
        throw createError(403, 'Insufficient permissions to delete this task');
    }

    // Soft delete by setting isArchived and archivedAt
    const [archivedTask] = await db
        .update(task)
        .set({
            isArchived: true,
            archivedAt: new Date(),
            updatedBy: userId,
            updatedAt: new Date(),
        })
        .where(eq(task.id, existingTask.id))
        .returning({
            id: task.id,
            isArchived: task.isArchived,
            archivedAt: task.archivedAt
        });

    return archivedTask;
};

module.exports = {
    getAllTasks,
    getAllTasksForUser,
    getAllTasksForClub,
    getAllTasksForMembership,
    findTaskById,
    createTask,
    updateTask,
    deleteTask,
};