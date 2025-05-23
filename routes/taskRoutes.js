const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');
const { isAuthenticated } = require('../middleware/CheckAuth');
const { parseQueryParams } = require('../middleware/QueryParser');
const validateBody = require('../middleware/validateBody');
const asyncHandler = require('../utils/asyncHandler');
const {
    insertTaskSchema,
    updateTaskSchema,
} = require('../dist/db/schema/task');


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

// Update task (task owner or club admin/HR)
router.put(
    '/:taskUuid',
    isAuthenticated,
    asyncHandler(taskController.updateTask)
);

// Delete task - soft delete (task owner or club admin/HR)
router.delete(
    '/:taskUuid',
    isAuthenticated,
    asyncHandler(taskController.deleteTask)
);

module.exports = router;