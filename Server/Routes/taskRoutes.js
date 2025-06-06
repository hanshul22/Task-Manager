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
const { protect } = require('../Middleware/authMiddleware');

const router = express.Router();

// Apply authentication middleware to all routes
router.use(protect);

// Task CRUD routes
router.route('/')
    .get(getTasks)        // GET /api/tasks - Get all tasks with filtering & pagination
    .post(createTask);    // POST /api/tasks - Create new task

// Special routes (must be before /:id routes)
router.get('/stats', getTaskStats);           // GET /api/tasks/stats - Get task statistics
router.patch('/bulk', bulkUpdateTasks);       // PATCH /api/tasks/bulk - Bulk update tasks

// Individual task routes
router.route('/:id')
    .get(getTask)         // GET /api/tasks/:id - Get single task
    .put(updateTask)      // PUT /api/tasks/:id - Update task
    .delete(deleteTask);  // DELETE /api/tasks/:id - Delete task (soft delete)

module.exports = router; 