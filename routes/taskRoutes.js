const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');
const { isAuthenticated } = require('../middleware/CheckAuth');
const { parseQueryParams } = require('../middleware/QueryParser');
const validateBody = require('../middleware/validateBody');
const asyncHandler = require('../utils/asyncHandler');


// Get all tasks for a specific club
router.get(
    '/clubs/:clubUuid/tasks',
    isAuthenticated,
    parseQueryParams,
    asyncHandler(taskController.getAllTasksForClub)
);

// Get all tasks for a specific membership
router.get(
    '/memberships/:membershipUuid/tasks',
    isAuthenticated,
    parseQueryParams,
    asyncHandler(taskController.getAllTasksForMembership)
);

// Get all tasks for a specific user
router.get(
    '/user/:userUuid',
    isAuthenticated,
    parseQueryParams,
    asyncHandler(taskController.getAllTasksForUser)
);

// Get all tasks
router.get(
    '/',
    isAuthenticated,
    parseQueryParams,
    asyncHandler(taskController.getAllTasks)
);

// Get task by UUID
router.get(
    '/:taskUuid',
    isAuthenticated,
    parseQueryParams,
    asyncHandler(taskController.getTaskById)
);

// Create task
router.post(
    '/',
    isAuthenticated,
    asyncHandler(taskController.createTask)
);

// Update task
router.put(
    '/:taskUuid',
    isAuthenticated,
    asyncHandler(taskController.updateTask)
);

// Delete task - soft delete 
router.delete(
    '/:taskUuid',
    isAuthenticated,
    asyncHandler(taskController.deleteTask)
);

module.exports = router;