const express = require('express');
const {
    register,
    login,
    logout,
    getMe,
    updateProfile,
    changePassword
} = require('../Controller/authController');
const { protect, createRateLimiter } = require('../Middleware/authMiddleware');

const router = express.Router();

// Rate limiting for auth endpoints
const authRateLimit = createRateLimiter(15 * 60 * 1000, 10); // 10 requests per 15 minutes
const loginRateLimit = createRateLimiter(15 * 60 * 1000, 5);  // 5 login attempts per 15 minutes

// Public routes
router.post('/register', authRateLimit, register);    // POST /api/auth/register
router.post('/login', loginRateLimit, login);         // POST /api/auth/login

// Protected routes
router.use(protect); // Apply authentication to all routes below

router.post('/logout', logout);                       // POST /api/auth/logout
router.get('/me', getMe);                            // GET /api/auth/me
router.put('/profile', authRateLimit, updateProfile); // PUT /api/auth/profile
router.put('/password', authRateLimit, changePassword); // PUT /api/auth/password

module.exports = router; 