const { db } = require('../dist/db');
const { task } = require('../dist/db/schema');
const { eq, and, ilike, ne, sql } = require('drizzle-orm');
const { insertTaskSchema, updateTaskSchema } = require('../dist/db/schema/task');

const getAllTasks = async (req, res) => {
    try {
        // Get query parameters (assume middleware passes these)
        const page = parseInt(req.query.page) || 1;
        const limit = Math.min(parseInt(req.query.limit) || 10, 50); // Max 50 items per page
        const offset = (page - 1) * limit;
        const search = req.query.search;
        const status = req.query?.status?.eq;
        const category = req.query?.category?.eq;
        
        let conditions = [ne(task.isArchived, true)]; // Filter out archived tasks
        
        if (search) {
            conditions.push(ilike(task.title, `%${search}%`));
        }
        
        if (status) {
            conditions.push(eq(task.status, status));
        }
        
        if (category) {
            conditions.push(eq(task.category, category));
        }
        
        const tasks = await db.query.task.findMany({
            where: and(...conditions),
            limit: limit,
            offset: offset,
            with: {
                clubMembership: true,
                createdByUser: {
                    columns: {
                        displayName: true,
                        uuid: true
                    }
                }
            }
        });
        
        const totalCount = await db.select({ count: sql`count(*)` })
            .from(task)
            .where(and(...conditions));
        
        const total = parseInt(totalCount[0]?.count || '0');
        const pages = Math.ceil(total / limit);
        
        res.json({
            success: true,
            data: {
                tasks,
                pagination: {
                    page,
                    limit,
                    total,
                    pages
                }
            }
        });
    } catch (error) {
        console.error('Error in getAllTasks:', error);
        res.status(500).json({
            success: false,
            error: "Failed to fetch tasks",
            message: error.message
        });
    }
};


const getTaskById = async (req, res) => {
    try {
        const { taskUuid } = req.params;
        
        if (!isValidUUID(taskUuid)) {
            return res.status(400).json({
                success: false,
                error: "Invalid task UUID format"
            });
        }
        
        const taskData = await db.query.task.findFirst({
            where: and(
                eq(task.uuid, taskUuid),
                ne(task.isArchived, true) // Exclude archived tasks
            ),
            with: {
                clubMembership: true,
                createdByUser: {
                    columns: {
                        displayName: true,
                        uuid: true
                    }
                },
                updatedByUser: {
                    columns: {
                        displayName: true,
                        uuid: true
                    }
                }
            }
        });
        
        if (!taskData) {
            return res.status(404).json({
                success: false,
                error: "Task not found"
            });
        }
        
        res.json({
            success: true,
            data: taskData
        });
    } catch (error) {
        console.error('Error in getTaskById:', error);
        res.status(500).json({
            success: false,
            error: "Failed to fetch task",
            message: error.message
        });
    }
};


const createTask = async (req, res) => {
    try {
        console.log('=== DEBUG START ===');
        console.log('req.headers:', req.headers);
        console.log('req.body:', req.body);
        
        // Get user ID from header for API authentication in non-production environments
        // In production, req.user would be populated by passport
        const userId = req.user ? req.user.id : parseInt(req.headers['x-user-id']);
        
        console.log('x-user-id header:', req.headers['x-user-id']);
        console.log('userId after parseInt:', userId);
        console.log('typeof userId:', typeof userId);
        console.log('isNaN(userId):', isNaN(userId));
        
        if (!userId || isNaN(userId)) {
            return res.status(401).json({ 
                success: false, 
                error: 'Authentication required. Please provide valid x-user-id header.' 
            });
        }
        
        // Prepare task data with required fields - hardcode for testing
        const taskData = {
            clubMembershipId: req.body.clubMembershipId,
            title: req.body.title,
            description: req.body.description,
            volunteeredSeconds: req.body.volunteeredSeconds,
            category: req.body.category,
            attachment: req.body.attachment,
            createdBy: userId,
            updatedBy: userId,
            status: 'pending'
        };
        
        console.log('taskData constructed:', taskData);
        console.log('=== DEBUG END ===');
        
        // Validate request body
        const validatedData = insertTaskSchema.safeParse(taskData);
        
        if (!validatedData.success) {
            console.log('Validation failed:', validatedData.error);
            return res.status(400).json({
                success: false,
                error: JSON.stringify(validatedData.error.errors, null, 2)
            });
        }
        
        console.log('Validation successful, inserting:', validatedData.data);
        
        const [newTask] = await db.insert(task)
            .values(validatedData.data)
            .returning();
        
        res.status(201).json({
            success: true,
            data: newTask
        });
    } catch (error) {
        console.error('Error in createTask:', error);
        res.status(500).json({
            success: false,
            error: "Failed to create task",
            message: error.message
        });
    }
};

const updateTask = async (req, res) => {
    try {
        const { taskUuid } = req.params;
        
        // Get user ID from header for API authentication in non-production environments
        const userId = req.user ? req.user.id : parseInt(req.headers['x-user-id']);
        
        if (!userId || isNaN(userId)) {
            return res.status(401).json({ 
                success: false, 
                error: 'Authentication required. Please provide valid x-user-id header.' 
            });
        }
        
        if (!isValidUUID(taskUuid)) {
            return res.status(400).json({
                success: false,
                error: "Invalid task UUID format"
            });
        }
        
        const existingTask = await db.query.task.findFirst({
            where: and(
                eq(task.uuid, taskUuid),
                ne(task.isArchived, true) // Exclude archived tasks
            )
        });
        
        if (!existingTask) {
            return res.status(404).json({
                success: false,
                error: "Task not found"
            });
        }
        
        // Prepare update data
        const updateData = {
            ...req.body,
            updatedBy: userId
        };
        
        // Validate request body
        const validatedData = updateTaskSchema.safeParse(updateData);
        
        if (!validatedData.success) {
            return res.status(400).json({
                success: false,
                error: JSON.stringify(validatedData.error.errors, null, 2)
            });
        }
        
        const [updatedTask] = await db.update(task)
            .set(validatedData.data)
            .where(eq(task.uuid, taskUuid))
            .returning();
        
        res.json({
            success: true,
            data: updatedTask
        });
    } catch (error) {
        console.error('Error in updateTask:', error);
        res.status(500).json({
            success: false,
            error: "Failed to update task",
            message: error.message
        });
    }
};

const deleteTask = async (req, res) => {
    try {
        const { taskUuid } = req.params;
        
        // Get user ID from header for API authentication in non-production environments
        const userId = req.user ? req.user.id : parseInt(req.headers['x-user-id']);
        
        if (!userId || isNaN(userId)) {
            return res.status(401).json({ 
                success: false, 
                error: 'Authentication required. Please provide valid x-user-id header.' 
            });
        }
        
        if (!isValidUUID(taskUuid)) {
            return res.status(400).json({
                success: false,
                error: "Invalid task UUID format"
            });
        }
        
        const existingTask = await db.query.task.findFirst({
            where: eq(task.uuid, taskUuid)
        });
        
        if (!existingTask) {
            return res.status(404).json({
                success: false,
                error: "Task not found"
            });
        }
        
        // Archive task rather than deleting
        await db.update(task)
            .set({ 
                isArchived: true,
                archivedAt: new Date(),
                updatedBy: userId
            })
            .where(eq(task.uuid, taskUuid));
        
        res.status(204).send();
    } catch (error) {
        console.error('Error in deleteTask:', error);
        res.status(500).json({
            success: false,
            error: "Failed to delete task",
            message: error.message
        });
    }
};

// Helper function for UUID validation
const isValidUUID = (uuid) => {
    const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
};

module.exports = {
    getAllTasks,
    getTaskById,
    createTask,
    updateTask,
    deleteTask
};
