const taskService = require('../services/taskService');
const { insertTaskSchema, updateTaskSchema } = require('../dist/db/schema/task');

// Helper function for UUID validation
const isValidUUID = (uuid) => {
    const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
};

const getAllTasks = async (req, res) => {
    try {
        // Get user ID for myTasks filtering
        const userId = req.user ? req.user.id : parseInt(req.headers['x-user-id']);
        const myTasks = req.query.myTasks === 'true';
        
        // Build service parameters
        const params = {
            pagination: {
                page: parseInt(req.query.page) || 1,
                limit: Math.min(parseInt(req.query.limit) || 10, 50)
            },
            search: req.query.search,
            filters: {
                status: req.query?.status?.eq ? { eq: req.query.status.eq } : undefined,
                category: req.query?.category?.eq ? { eq: req.query.category.eq } : undefined
            },
            currentUserId: myTasks && userId && !isNaN(userId) ? userId : null
        };

        // Clean up undefined filters
        Object.keys(params.filters).forEach(key => {
            if (params.filters[key] === undefined) {
                delete params.filters[key];
            }
        });

        const result = await taskService.getAllTasks(params);

        res.json({
            success: true,
            data: {
                tasks: result.items,
                pagination: {
                    page: result.pagination.page,
                    limit: result.pagination.limit,
                    total: result.pagination.total,
                    pages: result.pagination.totalPages
                }
            }
        });
    } catch (error) {
        console.error('Error in getAllTasks:', error);
        const statusCode = error.statusCode || 500;
        res.status(statusCode).json({
            success: false,
            error: error.message || "Failed to fetch tasks"
        });
    }
};

const getAllTasksForUser = async (req, res) => {
    try {
        const { userUuid } = req.params;
        
        // Build service parameters
        const params = {
            pagination: {
                page: parseInt(req.query.page) || 1,
                limit: Math.min(parseInt(req.query.limit) || 10, 50)
            },
            search: req.query.search,
            filters: {
                status: req.query?.status?.eq ? { eq: req.query.status.eq } : undefined,
                category: req.query?.category?.eq ? { eq: req.query.category.eq } : undefined
            }
        };

        // Clean up undefined filters
        Object.keys(params.filters).forEach(key => {
            if (params.filters[key] === undefined) {
                delete params.filters[key];
            }
        });

        const result = await taskService.getAllTasksForUser(userUuid, params);

        res.json({
            success: true,
            data: {
                tasks: result.items,
                userUuid: result.userUuid,
                pagination: {
                    page: result.pagination.page,
                    limit: result.pagination.limit,
                    total: result.pagination.total,
                    pages: result.pagination.totalPages
                }
            }
        });
    } catch (error) {
        console.error('Error in getAllTasksForUser:', error);
        const statusCode = error.statusCode || 500;
        res.status(statusCode).json({
            success: false,
            error: error.message || "Failed to fetch user tasks"
        });
    }
};

const getAllTasksForClub = async (req, res) => {
    try {
        const { clubUuid } = req.params;
        
        // Build service parameters
        const params = {
            pagination: {
                page: parseInt(req.query.page) || 1,
                limit: Math.min(parseInt(req.query.limit) || 10, 50)
            },
            search: req.query.search,
            filters: {
                status: req.query?.status?.eq ? { eq: req.query.status.eq } : undefined,
                category: req.query?.category?.eq ? { eq: req.query.category.eq } : undefined
            }
        };

        // Clean up undefined filters
        Object.keys(params.filters).forEach(key => {
            if (params.filters[key] === undefined) {
                delete params.filters[key];
            }
        });

        const result = await taskService.getAllTasksForClub(clubUuid, params);

        res.json({
            success: true,
            data: {
                tasks: result.items,
                clubUuid: result.clubUuid,
                pagination: {
                    page: result.pagination.page,
                    limit: result.pagination.limit,
                    total: result.pagination.total,
                    pages: result.pagination.totalPages
                }
            }
        });
    } catch (error) {
        console.error('Error in getAllTasksForClub:', error);
        const statusCode = error.statusCode || 500;
        res.status(statusCode).json({
            success: false,
            error: error.message || "Failed to fetch club tasks"
        });
    }
};

const getAllTasksForMembership = async (req, res) => {
    try {
        const { membershipUuid } = req.params;
        
        // Build service parameters
        const params = {
            pagination: {
                page: parseInt(req.query.page) || 1,
                limit: Math.min(parseInt(req.query.limit) || 10, 50)
            },
            search: req.query.search,
            filters: {
                status: req.query?.status?.eq ? { eq: req.query.status.eq } : undefined,
                category: req.query?.category?.eq ? { eq: req.query.category.eq } : undefined
            }
        };

        // Clean up undefined filters
        Object.keys(params.filters).forEach(key => {
            if (params.filters[key] === undefined) {
                delete params.filters[key];
            }
        });

        const result = await taskService.getAllTasksForMembership(membershipUuid, params);

        res.json({
            success: true,
            data: {
                tasks: result.items,
                membershipUuid: result.membershipUuid,
                pagination: {
                    page: result.pagination.page,
                    limit: result.pagination.limit,
                    total: result.pagination.total,
                    pages: result.pagination.totalPages
                }
            }
        });
    } catch (error) {
        console.error('Error in getAllTasksForMembership:', error);
        const statusCode = error.statusCode || 500;
        res.status(statusCode).json({
            success: false,
            error: error.message || "Failed to fetch membership tasks"
        });
    }
};

const getTaskById = async (req, res) => {
    try {
        const { taskUuid } = req.params;
        
        const params = {};

        const taskData = await taskService.findTaskById(taskUuid, params);

        res.json({
            success: true,
            data: taskData
        });
    } catch (error) {
        console.error('Error in getTaskById:', error);
        const statusCode = error.statusCode || 500;
        res.status(statusCode).json({
            success: false,
            error: error.message || "Failed to fetch task"
        });
    }
};

const createTask = async (req, res) => {
    try {
        console.log('=== DEBUG START ===');
        console.log('req.headers:', req.headers);
        console.log('req.body:', req.body);
        
        // Check if request body is empty or malformed
        if (!req.body || Object.keys(req.body).length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Request body is required and must be valid JSON'
            });
        }
        
        // Get user ID from header for API authentication in non-production environments
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
        
        // Check required fields
        const requiredFields = ['clubMembershipId', 'title', 'description'];
        const missingFields = requiredFields.filter(field => !req.body[field]);
        
        if (missingFields.length > 0) {
            return res.status(400).json({
                success: false,
                error: `Missing required fields: ${missingFields.join(', ')}`
            });
        }
        
        // Handle clubMembershipId - can be either integer ID or UUID
        let clubMembershipId;
        
        if (isValidUUID(req.body.clubMembershipId)) {
            // If it's a UUID, provide helpful error message
            return res.status(400).json({
                success: false,
                error: 'clubMembershipId must be an integer ID, not UUID',
                message: 'To get the correct clubMembershipId, please use the club membership API: GET /club-memberships',
                received: req.body.clubMembershipId,
                expectedFormat: 'integer (e.g., 1, 2, 3)'
            });
        } else {
            // Convert to integer
            clubMembershipId = parseInt(req.body.clubMembershipId);
            if (isNaN(clubMembershipId)) {
                return res.status(400).json({
                    success: false,
                    error: 'clubMembershipId must be a valid integer ID',
                    received: req.body.clubMembershipId,
                    expectedFormat: 'integer (e.g., 1, 2, 3)'
                });
            }
        }
        
        // Prepare task data with required fields (exclude createdBy/updatedBy - service will add them)
        const taskData = {
            clubMembershipId: clubMembershipId,
            title: req.body.title,
            description: req.body.description,
            volunteeredSeconds: req.body.volunteeredSeconds,
            category: req.body.category,
            attachment: req.body.attachment,
            status: 'pending'
        };
        
        console.log('taskData constructed:', taskData);
        console.log('=== DEBUG END ===');
        
        // Validate request body (without createdBy/updatedBy since service adds them)
        const validatedData = insertTaskSchema.omit({ createdBy: true, updatedBy: true }).safeParse(taskData);
        
        if (!validatedData.success) {
            console.log('Validation failed:', validatedData.error);
            return res.status(400).json({
                success: false,
                error: 'Validation failed',
                details: validatedData.error.errors.map(err => ({
                    field: err.path.join('.'),
                    message: err.message,
                    received: err.received
                }))
            });
        }
        
        console.log('Validation successful, creating task with service:', validatedData.data);
        
        const newTask = await taskService.createTask(validatedData.data, userId);
        
        res.status(201).json({
            success: true,
            data: newTask
        });
    } catch (error) {
        console.error('Error in createTask:', error);
        
        // Handle specific error types
        if (error.type === 'entity.parse.failed') {
            return res.status(400).json({
                success: false,
                error: 'Invalid JSON format in request body',
                message: 'Please ensure all string values are properly quoted and JSON syntax is correct',
                details: error.message
            });
        }
        
        const statusCode = error.statusCode || 500;
        res.status(statusCode).json({
            success: false,
            error: error.message || "Failed to create task"
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
        
        // Validate request body
        const validatedData = updateTaskSchema.safeParse(req.body);
        
        if (!validatedData.success) {
            return res.status(400).json({
                success: false,
                error: JSON.stringify(validatedData.error.errors, null, 2)
            });
        }
        
        const updatedTask = await taskService.updateTask(taskUuid, validatedData.data, userId);
        
        res.json({
            success: true,
            data: updatedTask
        });
    } catch (error) {
        console.error('Error in updateTask:', error);
        const statusCode = error.statusCode || 500;
        res.status(statusCode).json({
            success: false,
            error: error.message || "Failed to update task"
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
        
        await taskService.deleteTask(taskUuid, userId);
        
        res.status(204).send();
    } catch (error) {
        console.error('Error in deleteTask:', error);
        const statusCode = error.statusCode || 500;
        res.status(statusCode).json({
            success: false,
            error: error.message || "Failed to delete task"
        });
    }
};

module.exports = {
    getAllTasks,
    getAllTasksForUser,
    getAllTasksForClub,
    getAllTasksForMembership,
    getTaskById,
    createTask,
    updateTask,
    deleteTask
};
