const jwt = require('jsonwebtoken');
const User = require('../Models/UserModel');

const tokenBlacklist = new Set();

// Protect routes middleware
const protect = async (req, res, next) => {
    try {
        let token;

        // Check if token exists in Authorization header
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }

        // Make sure token exists
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Access denied. No token provided',
                statusCode: 401
            });
        }

        // Check if token is blacklisted
        if (tokenBlacklist.has(token)) {
            return res.status(401).json({
                success: false,
                message: 'Token has been invalidated. Please login again',
                statusCode: 401
            });
        }

        try {
            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Get user from token (exclude password)
            const user = await User.findById(decoded.id).select('-password');

            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: 'Token is valid but user no longer exists',
                    statusCode: 401
                });
            }

            // Check if user is active (if you have user status field)
            if (user.isActive === false) {
                return res.status(401).json({
                    success: false,
                    message: 'User account has been deactivated',
                    statusCode: 401
                });
            }

            // Add user and token to request object
            req.user = user;
            req.token = token;

            next();
        } catch (err) {
            console.error('JWT verification failed:', err.message);

            if (err.name === 'TokenExpiredError') {
                return res.status(401).json({
                    success: false,
                    message: 'Token has expired. Please login again',
                    statusCode: 401
                });
            }

            if (err.name === 'JsonWebTokenError') {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid token format',
                    statusCode: 401
                });
            }

            return res.status(401).json({
                success: false,
                message: 'Not authorized to access this route',
                statusCode: 401
            });
        }
    } catch (error) {
        console.error('Authentication middleware error:', error.message);
        return res.status(500).json({
            success: false,
            message: 'Server Error in authentication',
            statusCode: 500
        });
    }
};

// Middleware to verify task ownership
const verifyTaskOwnership = async (req, res, next) => {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({
                success: false,
                message: 'Task ID is required',
                statusCode: 400
            });
        }

        // This middleware should be used after protect middleware
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required',
                statusCode: 401
            });
        }

        // Import Task model here to avoid circular dependency
        const Task = require('../Models/task');

        const taskExists = await Task.exists({
            _id: id,
            user: req.user.id,
            isDeleted: { $ne: true }
        });

        if (!taskExists) {
            return res.status(404).json({
                success: false,
                message: 'Task not found or access denied',
                statusCode: 404
            });
        }

        next();
    } catch (error) {
        console.error('Task ownership verification error:', error.message);

        // Handle invalid ObjectId
        if (error.name === 'CastError') {
            return res.status(400).json({
                success: false,
                message: 'Invalid task ID format',
                statusCode: 400
            });
        }

        return res.status(500).json({
            success: false,
            message: 'Server error in ownership verification',
            statusCode: 500
        });
    }
};

// Function to blacklist token (for logout)
const blacklistToken = (token) => {
    tokenBlacklist.add(token);

    // Optional: Clean up expired tokens periodically
    setTimeout(() => {
        try {
            const decoded = jwt.decode(token);
            if (decoded && decoded.exp * 1000 < Date.now()) {
                tokenBlacklist.delete(token);
            }
        } catch (error) {
            // Token might be malformed, remove it anyway
            tokenBlacklist.delete(token);
        }
    }, 24 * 60 * 60 * 1000); // Clean up after 24 hours
};

// Rate limiting middleware (simple implementation)
const createRateLimiter = (windowMs = 15 * 60 * 1000, max = 100) => {
    const requests = new Map();

    return (req, res, next) => {
        const identifier = req.user?.id || req.ip;
        const now = Date.now();
        const windowStart = now - windowMs;

        // Clean old requests
        if (requests.has(identifier)) {
            const userRequests = requests.get(identifier).filter(time => time > windowStart);
            requests.set(identifier, userRequests);
        }

        const currentRequests = requests.get(identifier) || [];

        if (currentRequests.length >= max) {
            return res.status(429).json({
                success: false,
                message: 'Too many requests. Please try again later',
                statusCode: 429,
                retryAfter: Math.ceil(windowMs / 1000)
            });
        }

        currentRequests.push(now);
        requests.set(identifier, currentRequests);
        next();
    };
};

module.exports = {
    protect,
    verifyTaskOwnership,
    blacklistToken,
    createRateLimiter
}; 