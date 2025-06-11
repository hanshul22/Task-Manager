const User = require('../Models/UserModel');
const { generateToken } = require('../Utils/tokenUtils');
const { validateUserRegistration, validateUserLogin } = require('../Utils/validation');
const { blacklistToken } = require('../Middleware/authMiddleware');

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res, next) => {
    try {
        // Validate input
        const { error } = validateUserRegistration(req.body);
        if (error) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: error.details.map(err => err.message),
                statusCode: 400
            });
        }

        const { name, email, password } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'User already exists with that email',
                statusCode: 400
            });
        }

        // Create user
        const user = await User.create({
            name,
            email,
            password
        });

        // Generate JWT token
        const token = generateToken(user._id);

        // Success response
        res.status(201).json({
            success: true,
            data: {
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    createdAt: user.createdAt
                },
                token
            },
            message: 'User registered successfully'
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res, next) => {
    try {
        // Validate input
        const { error } = validateUserLogin(req.body);
        if (error) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: error.details.map(err => err.message),
                statusCode: 400
            });
        }

        const { email, password } = req.body;

        // Check if user exists and include password for comparison
        const user = await User.findOne({ email }).select('+password');
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials',
                statusCode: 401
            });
        }

        // Check if password matches
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials',
                statusCode: 401
            });
        }

        // Generate JWT token
        const token = generateToken(user._id);

        // Update last login
        await User.findByIdAndUpdate(user._id, {
            lastLogin: new Date()
        });

        // Success response
        res.status(200).json({
            success: true,
            data: {
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    createdAt: user.createdAt
                },
                token
            },
            message: 'Login successful'
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
exports.logout = async (req, res, next) => {
    try {
        // Get token from request (added by auth middleware)
        const token = req.token;

        if (!token) {
            return res.status(400).json({
                success: false,
                message: 'No token provided',
                statusCode: 400
            });
        }

        // Blacklist the token
        blacklistToken(token);

        // Update user's last logout
        await User.findByIdAndUpdate(req.user.id, {
            lastLogout: new Date()
        });

        res.status(200).json({
            success: true,
            message: 'Logged out successfully'
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id);

        res.status(200).json({
            success: true,
            data: {
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    createdAt: user.createdAt,
                    updatedAt: user.updatedAt,
                    lastLogin: user.lastLogin,
                    lastActivity: user.lastActivity
                }
            },
            message: 'User profile retrieved successfully'
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
exports.updateProfile = async (req, res, next) => {
    try {
        const { name, email } = req.body;

        // Basic validation
        if (!name && !email) {
            return res.status(400).json({
                success: false,
                message: 'Please provide name or email to update',
                statusCode: 400
            });
        }

        // Check if new email already exists
        if (email && email !== req.user.email) {
            const existingUser = await User.findOne({ email });
            if (existingUser) {
                return res.status(400).json({
                    success: false,
                    message: 'Email already exists',
                    statusCode: 400
                });
            }
        }

        // Update user
        const updateData = {};
        if (name) updateData.name = name;
        if (email) updateData.email = email;

        const user = await User.findByIdAndUpdate(
            req.user.id,
            updateData,
            { new: true, runValidators: true }
        );

        res.status(200).json({
            success: true,
            data: {
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    createdAt: user.createdAt,
                    updatedAt: user.updatedAt
                }
            },
            message: 'Profile updated successfully'
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Change password
// @route   PUT /api/auth/password
// @access  Private
exports.changePassword = async (req, res, next) => {
    try {
        const { currentPassword, newPassword } = req.body;

        // Validate input
        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                message: 'Current password and new password are required',
                statusCode: 400
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'New password must be at least 6 characters',
                statusCode: 400
            });
        }

        // Get user with password
        const user = await User.findById(req.user.id).select('+password');

        // Check current password
        const isMatch = await user.comparePassword(currentPassword);
        if (!isMatch) {
            return res.status(400).json({
                success: false,
                message: 'Current password is incorrect',
                statusCode: 400
            });
        }

        // Update password
        user.password = newPassword;
        await user.save()

        res.status(200).json({
            success: true,
            message: 'Password changed successfully'
        });
    } catch (err) {
        next(err);
    }
}; 