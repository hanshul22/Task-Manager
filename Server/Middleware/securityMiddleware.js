const helmet = require('helmet');
const cors = require('cors');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');

// Security configuration
const securityConfig = {
    // CORS configuration
    corsOptions: {
        origin: function (origin, callback) {
            // Allow requests with no origin (mobile apps, postman, etc.)
            if (!origin) return callback(null, true);

            // In production, specify allowed origins
            const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
                'http://localhost:3000',
                'http://localhost:3001',
                'http://127.0.0.1:3000'
            ];

            if (allowedOrigins.includes(origin)) {
                callback(null, true);
            } else {
                callback(new Error('Not allowed by CORS policy'));
            }
        },
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
    },

    // Helmet configuration for security headers
    helmetOptions: {
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                scriptSrc: ["'self'", "'unsafe-inline'"],
                styleSrc: ["'self'", "'unsafe-inline'"],
                imgSrc: ["'self'", "data:", "https:"],
                connectSrc: ["'self'"],
                fontSrc: ["'self'"],
                objectSrc: ["'none'"],
                mediaSrc: ["'self'"],
                frameSrc: ["'none'"]
            }
        },
        crossOriginEmbedderPolicy: false,
        crossOriginResourcePolicy: { policy: "cross-origin" }
    }
};

// Request logging middleware
const requestLogger = (req, res, next) => {
    const timestamp = new Date().toISOString();
    const method = req.method;
    const url = req.originalUrl;
    const ip = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent') || 'Unknown';

    console.log(`[${timestamp}] ${method} ${url} - IP: ${ip} - User-Agent: ${userAgent}`);

    // Log user if authenticated
    if (req.user) {
        console.log(`[${timestamp}] Authenticated user: ${req.user.email} (ID: ${req.user.id})`);
    }

    next();
};

// IP monitoring for suspicious activity
const ipMonitoring = (() => {
    const suspiciousIPs = new Map();
    const SUSPICIOUS_THRESHOLD = 50; // requests per minute
    const BLOCK_DURATION = 15 * 60 * 1000; // 15 minutes

    return (req, res, next) => {
        const ip = req.ip || req.connection.remoteAddress;
        const now = Date.now();

        if (suspiciousIPs.has(ip)) {
            const ipData = suspiciousIPs.get(ip);

            // Check if IP is still blocked
            if (ipData.blockedUntil && now < ipData.blockedUntil) {
                return res.status(429).json({
                    success: false,
                    message: 'IP temporarily blocked due to suspicious activity',
                    statusCode: 429,
                    unblockTime: new Date(ipData.blockedUntil).toISOString()
                });
            }

            // Reset if block period has passed
            if (ipData.blockedUntil && now >= ipData.blockedUntil) {
                suspiciousIPs.delete(ip);
            }
        }

        next();
    };
})();

// Request validation middleware
const validateRequest = (req, res, next) => {
    // Check for common attack patterns
    const suspiciousPatterns = [
        /(<script[^>]*>.*?<\/script>)/gi,
        /(javascript:)/gi,
        /(onload=)/gi,
        /(onerror=)/gi,
        /(\$\{.*\})/gi, // Template injection
        /(union.*select)/gi, // SQL injection
        /(drop.*table)/gi,
        /(exec.*xp_)/gi
    ];

    const checkForAttacks = (obj) => {
        if (typeof obj === 'string') {
            return suspiciousPatterns.some(pattern => pattern.test(obj));
        }

        if (typeof obj === 'object' && obj !== null) {
            return Object.values(obj).some(value => checkForAttacks(value));
        }

        return false;
    };

    // Check request body and query parameters
    if (checkForAttacks(req.body) || checkForAttacks(req.query)) {
        console.warn(`Suspicious request detected from IP: ${req.ip}`);
        return res.status(400).json({
            success: false,
            message: 'Request contains potentially harmful content',
            statusCode: 400
        });
    }

    next();
};

// User session validation
const validateUserSession = async (req, res, next) => {
    // Only run if user is authenticated
    if (!req.user) {
        return next();
    }

    try {
        // Check if user still exists and is active
        const User = require('../Models/UserModel');
        const currentUser = await User.findById(req.user.id);

        if (!currentUser) {
            return res.status(401).json({
                success: false,
                message: 'User session invalid - user no longer exists',
                statusCode: 401
            });
        }

        // Update user's last activity
        await User.findByIdAndUpdate(req.user.id, {
            lastActivity: new Date()
        });

        next();
    } catch (error) {
        console.error('Session validation error:', error.message);
        next();
    }
};

// Content-Type validation
const validateContentType = (req, res, next) => {
    const contentType = req.get('Content-Type');

    // For POST, PUT, PATCH requests, ensure proper content type
    if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
        if (!contentType || !contentType.includes('application/json')) {
            return res.status(400).json({
                success: false,
                message: 'Content-Type must be application/json',
                statusCode: 400
            });
        }
    }

    next();
};

// Security headers middleware
const setSecurityHeaders = (req, res, next) => {
    // Remove sensitive headers
    res.removeHeader('X-Powered-By');

    // Add custom security headers
    res.setHeader('X-API-Version', '1.0');
    res.setHeader('X-Response-Time', Date.now() - req.startTime);

    next();
};

// Request timing middleware
const requestTiming = (req, res, next) => {
    req.startTime = Date.now();
    next();
};

module.exports = {
    // Individual middleware functions
    requestLogger,
    ipMonitoring,
    validateRequest,
    validateUserSession,
    validateContentType,
    setSecurityHeaders,
    requestTiming,

    // Security configuration
    securityConfig,

    // Combined security middleware stack
    securityStack: [
        requestTiming,
        helmet(securityConfig.helmetOptions),
        cors(securityConfig.corsOptions),
        mongoSanitize(),
        xss(),
        hpp(),
        requestLogger,
        ipMonitoring,
        validateRequest,
        validateContentType,
        setSecurityHeaders
    ]
}; 