const Tag = require('../Models/Tag');
const Task = require('../Models/task');

// @desc    Get all tags for authenticated user
// @route   GET /api/tags
// @access  Private
exports.getTags = async (req, res, next) => {
    try {
        const {
            page = 1,
            limit = 50,
            sortBy = 'createdAt',
            sortOrder = 'desc',
            search
        } = req.query;

        // Build filter object
        const filter = { user: req.user.id };

        // Handle search functionality
        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }

        // Build sort object
        const sortObj = {};
        sortObj[sortBy] = sortOrder === 'asc' ? 1 : -1;

        // Calculate pagination
        const skip = (page - 1) * limit;

        // Execute query with pagination
        const tags = await Tag.find(filter)
            .sort(sortObj)
            .skip(skip)
            .limit(parseInt(limit));

        // Get total count for pagination
        const totalTags = await Tag.countDocuments(filter);
        const totalPages = Math.ceil(totalTags / limit);

        // Success response with pagination info
        res.status(200).json({
            success: true,
            data: {
                tags,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages,
                    totalTags,
                    hasNextPage: page < totalPages,
                    hasPrevPage: page > 1
                }
            },
            message: 'Tags retrieved successfully'
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Get single tag
// @route   GET /api/tags/:id
// @access  Private
exports.getTag = async (req, res, next) => {
    try {
        const tag = await Tag.findOne({
            _id: req.params.id,
            user: req.user.id
        });

        if (!tag) {
            return res.status(404).json({
                success: false,
                message: 'Tag not found',
                statusCode: 404
            });
        }

        res.status(200).json({
            success: true,
            data: { tag },
            message: 'Tag retrieved successfully'
        });
    } catch (err) {
        // Handle invalid ObjectId
        if (err.name === 'CastError') {
            return res.status(400).json({
                success: false,
                message: 'Invalid tag ID',
                statusCode: 400
            });
        }
        next(err);
    }
};

// @desc    Create new tag
// @route   POST /api/tags
// @access  Private
exports.createTag = async (req, res, next) => {
    try {
        // Create tag with user reference
        const tag = await Tag.create({
            ...req.body,
            user: req.user.id
        });

        // Success response
        res.status(201).json({
            success: true,
            data: { tag },
            message: 'Tag created successfully'
        });
    } catch (err) {
        // Handle duplicate tag name for user
        if (err.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'Tag with this name already exists',
                statusCode: 400
            });
        }
        next(err);
    }
};

// @desc    Update tag
// @route   PUT /api/tags/:id
// @access  Private
exports.updateTag = async (req, res, next) => {
    try {
        // Find tag and ensure user owns it
        let tag = await Tag.findOne({
            _id: req.params.id,
            user: req.user.id
        });

        if (!tag) {
            return res.status(404).json({
                success: false,
                message: 'Tag not found',
                statusCode: 404
            });
        }

        // Update tag
        tag = await Tag.findByIdAndUpdate(
            req.params.id,
            req.body,
            {
                new: true,
                runValidators: true
            }
        );

        res.status(200).json({
            success: true,
            data: { tag },
            message: 'Tag updated successfully'
        });
    } catch (err) {
        // Handle invalid ObjectId
        if (err.name === 'CastError') {
            return res.status(400).json({
                success: false,
                message: 'Invalid tag ID',
                statusCode: 400
            });
        }
        // Handle duplicate tag name for user
        if (err.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'Tag with this name already exists',
                statusCode: 400
            });
        }
        next(err);
    }
};

// @desc    Delete tag (soft delete)
// @route   DELETE /api/tags/:id
// @access  Private
exports.deleteTag = async (req, res, next) => {
    try {
        // Find tag and ensure user owns it
        const tag = await Tag.findOne({
            _id: req.params.id,
            user: req.user.id
        });

        if (!tag) {
            return res.status(404).json({
                success: false,
                message: 'Tag not found',
                statusCode: 404
            });
        }

        // Check if tag is being used in any tasks
        const tasksUsingTag = await Task.countDocuments({
            user: req.user.id,
            tags: tag.name,
            isDeleted: { $ne: true }
        });

        // If tag is in use, ask for confirmation or prevent deletion
        if (tasksUsingTag > 0 && !req.body.force) {
            return res.status(400).json({
                success: false,
                message: `Tag is being used in ${tasksUsingTag} task(s). Use force=true to delete anyway.`,
                data: { tasksCount: tasksUsingTag },
                statusCode: 400
            });
        }

        // Soft delete
        await Tag.findByIdAndUpdate(req.params.id, {
            isDeleted: true,
            deletedAt: new Date()
        });

        // If forced deletion, remove tag from all tasks
        if (req.body.force && tasksUsingTag > 0) {
            await Task.updateMany(
                { user: req.user.id, tags: tag.name },
                { $pull: { tags: tag.name } }
            );
        }

        res.status(200).json({
            success: true,
            message: 'Tag deleted successfully',
            data: { removedFromTasks: req.body.force ? tasksUsingTag : 0 }
        });
    } catch (err) {
        // Handle invalid ObjectId
        if (err.name === 'CastError') {
            return res.status(400).json({
                success: false,
                message: 'Invalid tag ID',
                statusCode: 400
            });
        }
        next(err);
    }
};

// @desc    Get tag statistics
// @route   GET /api/tags/stats
// @access  Private
exports.getTagStats = async (req, res, next) => {
    try {
        // Get total tags count
        const totalTags = await Tag.countDocuments({
            user: req.user.id
        });

        // Get most used tags
        const mostUsedTags = await Tag.find({
            user: req.user.id
        })
            .sort({ usageCount: -1 })
            .limit(10)
            .select('name usageCount color');

        // Get tags usage distribution
        const usageStats = await Tag.aggregate([
            { $match: { user: req.user._id, isDeleted: { $ne: true } } },
            {
                $group: {
                    _id: null,
                    totalTags: { $sum: 1 },
                    totalUsage: { $sum: '$usageCount' },
                    avgUsage: { $avg: '$usageCount' },
                    maxUsage: { $max: '$usageCount' },
                    minUsage: { $min: '$usageCount' }
                }
            }
        ]);

        const stats = {
            totalTags,
            mostUsedTags,
            usage: usageStats[0] || {
                totalTags: 0,
                totalUsage: 0,
                avgUsage: 0,
                maxUsage: 0,
                minUsage: 0
            }
        };

        res.status(200).json({
            success: true,
            data: { stats },
            message: 'Tag statistics retrieved successfully'
        });
    } catch (err) {
        next(err);
    }
}; 