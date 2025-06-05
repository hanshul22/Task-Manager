const jwt = require('jsonwebtoken');

// Generate JWT token
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE || '30d',
    });
};

// Generate JWT token with custom expiration
const generateTokenWithExpiration = (id, expiresIn) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn,
    });
};

module.exports = {
    generateToken,
    generateTokenWithExpiration
}; 