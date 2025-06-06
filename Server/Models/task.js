const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Title is required'],
        trim: true,
        maxlength: [100, 'Title cannot be more than 100 characters']
    },
    description: {
        type: String,
        trim: true,
        maxlength: [1000, 'Description cannot be more than 1000 characters']
    },
    status: {
        type: String,
        enum: {
            values: ['pending', 'in-progress', 'completed', 'cancelled'],
            message: 'Status must be one of: pending, in-progress, completed, cancelled'
        },
        default: 'pending'
    },
    priority: {
        type: String,
        enum: {
            values: ['low', 'medium', 'high', 'critical'],
            message: 'Priority must be one of: low, medium, high, critical'
        },
        default: 'medium'
    },
    dueDate: {
        type: Date,
        validate: {
            validator: function (value) {
                return !value || value > new Date();
            },
            message: 'Due date must be in the future'
        }
    },
    tags: [{
        type: String,
        trim: true,
        maxlength: [30, 'Tag cannot be more than 30 characters']
    }],
    isCompleted: {
        type: Boolean,
        default: false
    },
    completedAt: {
        type: Date
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'User reference is required']
    },
    isDeleted: {
        type: Boolean,
        default: false
    },
    deletedAt: {
        type: Date
    }
}, {
    timestamps: true // Automatically add createdAt and updatedAt
});

// Pre-save middleware to handle completion status
taskSchema.pre('save', function (next) {
    if (this.status === 'completed' && !this.isCompleted) {
        this.isCompleted = true;
        this.completedAt = new Date();
    } else if (this.status !== 'completed' && this.isCompleted) {
        this.isCompleted = false;
        this.completedAt = undefined;
    }
    next();
});

// Index for better query performance
taskSchema.index({ user: 1, status: 1 });
taskSchema.index({ user: 1, dueDate: 1 });
taskSchema.index({ user: 1, priority: 1 });
taskSchema.index({ user: 1, createdAt: -1 });

// Virtual for checking if task is overdue
taskSchema.virtual('isOverdue').get(function () {
    return this.dueDate && this.dueDate < new Date() && !this.isCompleted;
});

// Include virtuals when converting to JSON
taskSchema.set('toJSON', { virtuals: true });

// Query middleware to exclude soft deleted tasks by default
taskSchema.pre(/^find/, function (next) {
    // Only exclude deleted tasks if not explicitly including them
    if (!this.getOptions().includeDeleted) {
        this.find({ isDeleted: { $ne: true } });
    }
    next();
});

// Populate user information when needed
taskSchema.pre(/^find/, function (next) {
    if (this.getOptions().populateUser) {
        this.populate({
            path: 'user',
            select: 'name email'
        });
    }
    next();
});

module.exports = mongoose.model('Task', taskSchema); 