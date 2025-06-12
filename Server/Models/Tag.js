const mongoose = require('mongoose');

const tagSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Tag name is required'],
        trim: true,
        maxlength: [30, 'Tag name cannot be more than 30 characters'],
        minlength: [1, 'Tag name must be at least 1 character']
    },
    color: {
        type: String,
        default: '#007bff',
        match: [/^#[0-9A-F]{6}$/i, 'Color must be a valid hex color code']
    },
    description: {
        type: String,
        trim: true,
        maxlength: [200, 'Description cannot be more than 200 characters']
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
    },
    usageCount: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

// Compound index to ensure unique tag names per user
tagSchema.index({ name: 1, user: 1 }, { unique: true });

// Index for better query performance
tagSchema.index({ user: 1, createdAt: -1 });
tagSchema.index({ user: 1, usageCount: -1 });

// Query middleware to exclude soft deleted tags by default
tagSchema.pre(/^find/, function (next) {
    if (!this.getOptions().includeDeleted) {
        this.find({ isDeleted: { $ne: true } });
    }
    next();
});

// Method to increment usage count
tagSchema.methods.incrementUsage = function () {
    this.usageCount += 1;
    return this.save();
};

// Method to decrement usage count
tagSchema.methods.decrementUsage = function () {
    if (this.usageCount > 0) {
        this.usageCount -= 1;
        return this.save();
    }
};

module.exports = mongoose.model('Tag', tagSchema); 