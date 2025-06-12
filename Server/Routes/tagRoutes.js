const express = require('express');
const {
    getTags,
    getTag,
    createTag,
    updateTag,
    deleteTag,
    getTagStats
} = require('../Controller/tagController');
const { protect, createRateLimiter } = require('../Middleware/authMiddleware');
const { validateUserSession } = require('../Middleware/securityMiddleware');
const { validationMiddleware } = require('../Middleware/validationMiddleware');

const router = express.Router();

// Apply authentication middleware to all routes
router.use(protect);

// Apply user session validation to all routes
router.use(validateUserSession);

// Rate limiting for different endpoints
const generalRateLimit = createRateLimiter(15 * 60 * 1000, 100); // 100 requests per 15 minutes
const createRateLimit = createRateLimiter(5 * 60 * 1000, 30);   // 30 creates per 5 minutes

// Tag CRUD routes
router.route('/')
    .get(
        generalRateLimit,
        validationMiddleware.validateTagQuery,
        getTags
    )        // GET /api/tags - Get all tags with filtering & pagination
    .post(
        createRateLimit,
        validationMiddleware.validateTagCreate,
        createTag
    );       // POST /api/tags - Create new tag

// Special routes (must be before /:id routes)
router.get('/stats', generalRateLimit, getTagStats);           // GET /api/tags/stats - Get tag statistics

// Individual tag routes
router.route('/:id')
    .get(
        generalRateLimit,
        validationMiddleware.validateMongoId,
        getTag
    )         // GET /api/tags/:id - Get single tag
    .put(
        generalRateLimit,
        validationMiddleware.validateMongoId,
        validationMiddleware.validateTagUpdate,
        updateTag
    )        // PUT /api/tags/:id - Update tag
    .delete(
        generalRateLimit,
        validationMiddleware.validateMongoId,
        deleteTag
    );    // DELETE /api/tags/:id - Delete tag (soft delete)

module.exports = router; 