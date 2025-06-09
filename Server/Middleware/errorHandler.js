// Global error handler middleware
const errorHandler = (err, req, res, next) => {
    let error = { ...err };
    error.message = err.message;

    // Log error to console for debugging (include stack trace in development)
    if (process.env.NODE_ENV === 'development') {
        console.error('Error Stack:', err.stack);
    } else {
        console.error('Error:', err.message);
    }

    // Mongoose bad ObjectId
    if (err.name === 'CastError') {
        error = {
            statusCode: 404,
            message: 'Resource not found',
            errors: [`Invalid ${err.path}: ${err.value}`]
        };
    }

    // Mongoose duplicate key
    if (err.code === 11000) {
        const field = Object.keys(err.keyValue)[0];
        const value = err.keyValue[field];
        error = {
            statusCode: 400,
            message: 'Duplicate field value entered',
            errors: [`${field} '${value}' already exists`]
        };
    }

    // Mongoose validation error
    if (err.name === 'ValidationError') {
        const errors = Object.values(err.errors).map(val => val.message);
        error = {
            statusCode: 400,
            message: 'Validation failed',
            errors
        };
    }

    // Joi validation error
    if (err.isJoi) {
        const errors = err.details.map(detail => detail.message);
        error = {
            statusCode: 400,
            message: 'Validation failed',
            errors
        };
    }

    // JWT errors
    if (err.name === 'JsonWebTokenError') {
        error = {
            statusCode: 401,
            message: 'Invalid token',
            errors: ['Authentication token is invalid']
        };
    }

    if (err.name === 'TokenExpiredError') {
        error = {
            statusCode: 401,
            message: 'Token expired',
            errors: ['Authentication token has expired']
        };
    }

    // Custom application errors
    if (err.name === 'CustomError') {
        error = {
            statusCode: err.statusCode || 400,
            message: err.message,
            errors: err.errors || []
        };
    }

    // Default to 500 server error
    const statusCode = error.statusCode || 500;
    const message = error.message || 'Internal Server Error';
    const errors = error.errors || [];

    // Send error response in standardized format
    res.status(statusCode).json({
        success: false,
        message,
        errors,
        statusCode,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
};

// Custom error class for application-specific errors
class CustomError extends Error {
    constructor(message, statusCode = 400, errors = []) {
        super(message);
        this.name = 'CustomError';
        this.statusCode = statusCode;
        this.errors = Array.isArray(errors) ? errors : [errors];
    }
}

module.exports = { errorHandler, CustomError }; 