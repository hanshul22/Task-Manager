const express = require('express');
const {
    register,
    login,
    logout,
    getMe,
    updateProfile,
    changePassword,
    forgotPassword,
    resetPassword
} = require('../Controller/authController');
const { protect, createRateLimiter } = require('../Middleware/authMiddleware');
const { validationMiddleware } = require('../Middleware/validationMiddleware');

const router = express.Router();

// Rate limiting for auth endpoints
const authRateLimit = createRateLimiter(15 * 60 * 1000, 10); // 10 requests per 15 minutes
const loginRateLimit = createRateLimiter(15 * 60 * 1000, 5);  // 5 login attempts per 15 minutes

// Public routes with validation
router.post('/register',
    authRateLimit,
    validationMiddleware.validateUserRegister,
    register
);    // POST /api/auth/register

router.post('/login',
    loginRateLimit,
    validationMiddleware.validateUserLogin,
    login
);         // POST /api/auth/login

// Password reset routes (public)
router.post('/forgot-password',
    authRateLimit,
    forgotPassword
); // POST /api/auth/forgot-password

router.post('/reset-password',
    authRateLimit,
    resetPassword
);  // POST /api/auth/reset-password

// Protected routes
router.use(protect); // Apply authentication to all routes below

router.post('/logout', logout);                       // POST /api/auth/logout
router.get('/me', getMe);                            // GET /api/auth/me
router.put('/profile', authRateLimit, updateProfile); // PUT /api/auth/profile
router.put('/password', authRateLimit, changePassword); // PUT /api/auth/password

module.exports = router; 