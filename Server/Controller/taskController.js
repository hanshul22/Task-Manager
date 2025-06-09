const Task = require('../Models/task');
const { CustomError } = require('../Middleware/errorHandler');

// @desc    Create new task
// @route   POST /api/tasks
// @access  Private
exports.createTask = async (req, res, next) => {
    try {
        // Create task with user reference (validation already done by middleware)
        const task = await Task.create({
            ...req.body,
            user: req.user.id
        });

        // Success response
        res.status(201).json({
            success: true,
            data: { task },
            message: 'Task created successfully'
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Get all tasks for authenticated user
// @route   GET /api/tasks
// @access  Private
exports.getTasks = async (req, res, next) => {
    try {
        // Validate query parameters
        const { error } = validateTaskQuery(req.query);
        console.log(error);
        if (error) {
            return res.status(400).json({
                success: false,
                message: 'Invalid query parameters',
                errors: error.details.map(err => err.message),
                statusCode: 400
            });
        }

        // Extract query parameters
        const {
            status,
            priority,
            page = 1,
            limit = 10,
            sortBy = 'createdAt',
            sortOrder = 'desc',
            search,
            tags,
            overdue
        } = req.query;

        // Build filter object
        const filter = { user: req.user.id };

        if (status) filter.status = status;
        if (priority) filter.priority = priority;
        if (tags) filter.tags = { $in: tags.split(',') };

        // Handle search functionality
        if (search) {
            filter.$or = [
                { title: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }

        // Handle overdue filter
        if (overdue === 'true') {
            filter.dueDate = { $lt: new Date() };
            filter.isCompleted = false;
        }

        // Build sort object
        const sortObj = {};
        sortObj[sortBy] = sortOrder === 'asc' ? 1 : -1;

        // Calculate pagination
        const skip = (page - 1) * limit;

        // Execute query with pagination
        const tasks = await Task.find(filter)
            .sort(sortObj)
            .skip(skip)
            .limit(parseInt(limit))
            .populate('user', 'name email');

        // Get total count for pagination
        const totalTasks = await Task.countDocuments(filter);
        const totalPages = Math.ceil(totalTasks / limit);

        // Success response with pagination info
        res.status(200).json({
            success: true,
            data: {
                tasks,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages,
                    totalTasks,
                    hasNextPage: page < totalPages,
                    hasPrevPage: page > 1
                }
            },
            message: 'Tasks retrieved successfully'
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Get single task
// @route   GET /api/tasks/:id
// @access  Private
exports.getTask = async (req, res, next) => {
    try {
        const task = await Task.findOne({
            _id: req.params.id,
            user: req.user.id
        }).populate('user', 'name email');

        if (!task) {
            return res.status(404).json({
                success: false,
                message: 'Task not found',
                statusCode: 404
            });
        }

        res.status(200).json({
            success: true,
            data: { task },
            message: 'Task retrieved successfully'
        });
    } catch (err) {
        // Handle invalid ObjectId
        if (err.name === 'CastError') {
            return res.status(400).json({
                success: false,
                message: 'Invalid task ID',
                statusCode: 400
            });
        }
        next(err);
    }
};

// @desc    Update task
// @route   PUT /api/tasks/:id
// @access  Private
exports.updateTask = async (req, res, next) => {
    try {
        // Validate input
        const { error } = validateTaskUpdate(req.body);
        if (error) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: error.details.map(err => err.message),
                statusCode: 400
            });
        }

        // Find task and ensure user owns it
        let task = await Task.findOne({
            _id: req.params.id,
            user: req.user.id
        });

        if (!task) {
            return res.status(404).json({
                success: false,
                message: 'Task not found',
                statusCode: 404
            });
        }

        // Update task
        task = await Task.findByIdAndUpdate(
            req.params.id,
            req.body,
            {
                new: true,
                runValidators: true
            }
        ).populate('user', 'name email');

        res.status(200).json({
            success: true,
            data: { task },
            message: 'Task updated successfully'
        });
    } catch (err) {
        // Handle invalid ObjectId
        if (err.name === 'CastError') {
            return res.status(400).json({
                success: false,
                message: 'Invalid task ID',
                statusCode: 400
            });
        }
        next(err);
    }
};

// @desc    Delete task (soft delete)
// @route   DELETE /api/tasks/:id
// @access  Private
exports.deleteTask = async (req, res, next) => {
    try {
        // Find task and ensure user owns it
        const task = await Task.findOne({
            _id: req.params.id,
            user: req.user.id
        });

        if (!task) {
            return res.status(404).json({
                success: false,
                message: 'Task not found',
                statusCode: 404
            });
        }

        // Soft delete
        await Task.findByIdAndUpdate(req.params.id, {
            isDeleted: true,
            deletedAt: new Date()
        });

        res.status(200).json({
            success: true,
            message: 'Task deleted successfully'
        });
    } catch (err) {
        // Handle invalid ObjectId
        if (err.name === 'CastError') {
            return res.status(400).json({
                success: false,
                message: 'Invalid task ID',
                statusCode: 400
            });
        }
        next(err);
    }
};

// @desc    Get task statistics
// @route   GET /api/tasks/stats
// @access  Private
exports.getTaskStats = async (req, res, next) => {
    try {
        const stats = await Task.aggregate([
            { $match: { user: req.user._id, isDeleted: { $ne: true } } },
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 }
                }
            }
        ]);

        // Get overdue tasks count
        const overdueCount = await Task.countDocuments({
            user: req.user.id,
            dueDate: { $lt: new Date() },
            isCompleted: false,
            isDeleted: { $ne: true }
        });

        // Get total tasks count
        const totalTasks = await Task.countDocuments({
            user: req.user.id,
            isDeleted: { $ne: true }
        });

        // Format stats
        const formattedStats = {
            total: totalTasks,
            overdue: overdueCount,
            byStatus: {}
        };

        stats.forEach(stat => {
            formattedStats.byStatus[stat._id] = stat.count;
        });

        res.status(200).json({
            success: true,
            data: { stats: formattedStats },
            message: 'Task statistics retrieved successfully'
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Bulk update tasks
// @route   PATCH /api/tasks/bulk
// @access  Private
exports.bulkUpdateTasks = async (req, res, next) => {
    try {
        const { taskIds, updateData } = req.body;

        // Validate input
        if (!taskIds || !Array.isArray(taskIds) || taskIds.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Task IDs are required and must be an array',
                statusCode: 400
            });
        }

        if (!updateData || Object.keys(updateData).length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Update data is required',
                statusCode: 400
            });
        }

        // Validate update data
        const { error } = validateTaskUpdate(updateData);
        if (error) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: error.details.map(err => err.message),
                statusCode: 400
            });
        }

        // Update tasks that belong to the user
        const result = await Task.updateMany(
            {
                _id: { $in: taskIds },
                user: req.user.id,
                isDeleted: { $ne: true }
            },
            updateData
        );

        res.status(200).json({
            success: true,
            data: {
                modifiedCount: result.modifiedCount,
                matchedCount: result.matchedCount
            },
            message: `${result.modifiedCount} tasks updated successfully`
        });
    } catch (err) {
        next(err);
    }
}; 