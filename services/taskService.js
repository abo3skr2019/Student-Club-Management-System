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
        include = []
    } = params;
    const { page = 1, limit = 10 } = pagination;

    // Calculate offset
    const offset = (page - 1) * limit;

    // Build where conditions - always filter out archived tasks
    let whereConditions = [eq(task.isArchived, false)];

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

    // Build the with clause for relations
    const withClause = {};
    if (include.includes('clubMembership')) {
        withClause.clubMembership = {
            with: {
                user: true,
                club: true
            }
        };
    }
    if (include.includes('createdByUser')) {
        withClause.createdByUser = true;
    }
    if (include.includes('updatedByUser')) {
        withClause.updatedByUser = true;
    }

    // Get paginated tasks
    const tasks = await db.query.task.findMany({
        where: whereClause,
        columns,
        with: withClause,
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


const findTaskById = async (taskId, params = {}) => {
    const { fields = [], include = [] } = params;

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

    // Build the with clause for relations
    const withClause = {};
    if (include.includes('clubMembership')) {
        withClause.clubMembership = {
            with: {
                user: true,
                club: true
            }
        };
    }
    if (include.includes('createdByUser')) {
        withClause.createdByUser = true;
    }
    if (include.includes('updatedByUser')) {
        withClause.updatedByUser = true;
    }

    const taskData = await db.query.task.findFirst({
        where: whereClause,
        columns,
        with: withClause
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
    findTaskById,
    createTask,
    updateTask,
    deleteTask,
};