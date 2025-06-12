const express = require('express');
const {
    createTask,
    getTasks,
    getTask,
    updateTask,
    deleteTask,
    getTaskStats,
    bulkUpdateTasks
} = require('../Controller/taskController');
const { protect, verifyTaskOwnership, createRateLimiter } = require('../Middleware/authMiddleware');
const { validateUserSession } = require('../Middleware/securityMiddleware');
const { validationMiddleware } = require('../Middleware/validationMiddleware');

const router = express.Router();

// Apply authentication middleware to all routes
router.use(protect);

// Apply user session validation to all routes
router.use(validateUserSession);

// Rate limiting for different endpoints
const generalRateLimit = createRateLimiter(15 * 60 * 1000, 100); // 100 requests per 15 minutes
const createRateLimit = createRateLimiter(5 * 60 * 1000, 20);   // 20 creates per 5 minutes
const bulkRateLimit = createRateLimiter(10 * 60 * 1000, 5);     // 5 bulk operations per 10 minutes

// Task CRUD routes
router.route('/')
    .get(
        generalRateLimit,
        validationMiddleware.validateTaskQuery,
        getTasks
    )        // GET /api/tasks - Get all tasks with filtering & pagination
    .post(
        createRateLimit,
        validationMiddleware.validateTaskCreate,
        createTask
    );     // POST /api/tasks - Create new task

// Special routes (must be before /:id routes)
router.get('/search',
    generalRateLimit,
    validationMiddleware.validateTaskQuery,
    getTasks
);           // GET /api/tasks/search - Search tasks (same as GET /api/tasks but separate endpoint)
router.get('/stats', generalRateLimit, getTaskStats);           // GET /api/tasks/stats - Get task statistics
router.patch('/bulk', bulkRateLimit, bulkUpdateTasks);          // PATCH /api/tasks/bulk - Bulk update tasks

// Individual task routes with ownership verification
router.route('/:id')
    .get(
        generalRateLimit,
        validationMiddleware.validateMongoId,
        verifyTaskOwnership,
        getTask
    )         // GET /api/tasks/:id - Get single task
    .put(
        generalRateLimit,
        validationMiddleware.validateMongoId,
        verifyTaskOwnership,
        validationMiddleware.validateTaskUpdate,
        updateTask
    )      // PUT /api/tasks/:id - Update task
    .delete(
        generalRateLimit,
        validationMiddleware.validateMongoId,
        verifyTaskOwnership,
        deleteTask
    );  // DELETE /api/tasks/:id - Delete task (soft delete)

module.exports = router; 