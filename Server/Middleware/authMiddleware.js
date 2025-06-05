const jwt = require('jsonwebtoken');
const User = require('../Models/UserModel');

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
                message: 'Not authorized to access this route',
                statusCode: 401
            });
        }

        try {
            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Get user from token
            req.user = await User.findById(decoded.id);

            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    message: 'User not found',
                    statusCode: 401
                });
            }

            next();
        } catch (err) {
            return res.status(401).json({
                success: false,
                message: 'Not authorized to access this route',
                statusCode: 401
            });
        }
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Server Error',
            statusCode: 500
        });
    }
};

module.exports = { protect }; 