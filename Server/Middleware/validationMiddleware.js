const Joi = require('joi');
const { CustomError } = require('./errorHandler');

/**
 * Generic validation middleware factory
 * @param {Object} schema - Joi validation schema
 * @param {String} property - Request property to validate ('body', 'params', 'query')
 * @returns {Function} Express middleware function
 */
const validate = (schema, property = 'body') => {
    return (req, res, next) => {
        const { error, value } = schema.validate(req[property], {
            abortEarly: false, // Return all validation errors
            stripUnknown: true, // Remove unknown fields
            allowUnknown: false // Don't allow unknown fields
        });

        if (error) {
            const errors = error.details.map(detail => detail.message);
            return next(new CustomError('Validation failed', 400, errors));
        }

        // Replace request property with validated and sanitized data
        req[property] = value;
        next();
    };
};

/**
 * Validation schemas for different endpoints
 */
const validationSchemas = {
    // User Authentication Schemas
    userRegister: Joi.object({
        name: Joi.string()
            .trim()
            .min(2)
            .max(50)
            .pattern(/^[a-zA-Z\s]+$/)
            .required()
            .messages({
                'string.pattern.base': 'Name can only contain letters and spaces',
                'string.min': 'Name must be at least 2 characters long',
                'string.max': 'Name cannot exceed 50 characters'
            }),
        email: Joi.string()
            .email()
            .lowercase()
            .trim()
            .required()
            .messages({
                'string.email': 'Please provide a valid email address'
            }),
        password: Joi.string()
            .min(8)
            .max(128)
            .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
            .required()
            .messages({
                'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
                'string.min': 'Password must be at least 8 characters long',
                'string.max': 'Password cannot exceed 128 characters'
            }),
        confirmPassword: Joi.string()
            .valid(Joi.ref('password'))
            .required()
            .messages({
                'any.only': 'Password confirmation does not match password'
            })
    }),

    userLogin: Joi.object({
        email: Joi.string()
            .email()
            .lowercase()
            .trim()
            .required()
            .messages({
                'string.email': 'Please provide a valid email address'
            }),
        password: Joi.string()
            .required()
            .messages({
                'any.required': 'Password is required'
            })
    }),

    // Task Management Schemas
    taskCreate: Joi.object({
        title: Joi.string()
            .trim()
            .min(1)
            .max(200)
            .required()
            .messages({
                'string.min': 'Task title cannot be empty',
                'string.max': 'Task title cannot exceed 200 characters'
            }),
        description: Joi.string()
            .trim()
            .max(1000)
            .allow('')
            .optional()
            .messages({
                'string.max': 'Task description cannot exceed 1000 characters'
            }),
        status: Joi.string()
            .valid('pending', 'in-progress', 'completed')
            .default('pending')
            .messages({
                'any.only': 'Status must be one of: pending, in-progress, completed'
            }),
        priority: Joi.string()
            .valid('low', 'medium', 'high', 'critical')
            .default('medium')
            .messages({
                'any.only': 'Priority must be one of: low, medium, high, critical'
            }),
        dueDate: Joi.date()
            .iso()
            .min('now')
            .optional()
            .messages({
                'date.min': 'Due date cannot be in the past',
                'date.iso': 'Due date must be a valid ISO date format'
            }),
        tags: Joi.array()
            .items(Joi.string().trim().min(1).max(50))
            .max(10)
            .unique()
            .default([])
            .messages({
                'array.max': 'Cannot have more than 10 tags',
                'array.unique': 'Tags must be unique',
                'string.max': 'Each tag cannot exceed 50 characters'
            }),
        isRecurring: Joi.boolean().default(false),
        recurringPattern: Joi.string()
            .valid('daily', 'weekly', 'monthly')
            .when('isRecurring', {
                is: true,
                then: Joi.required(),
                otherwise: Joi.optional()
            })
            .messages({
                'any.only': 'Recurring pattern must be one of: daily, weekly, monthly'
            })
    }),

    taskUpdate: Joi.object({
        title: Joi.string()
            .trim()
            .min(1)
            .max(200)
            .optional()
            .messages({
                'string.min': 'Task title cannot be empty',
                'string.max': 'Task title cannot exceed 200 characters'
            }),
        description: Joi.string()
            .trim()
            .max(1000)
            .allow('')
            .optional()
            .messages({
                'string.max': 'Task description cannot exceed 1000 characters'
            }),
        status: Joi.string()
            .valid('pending', 'in-progress', 'completed')
            .optional()
            .messages({
                'any.only': 'Status must be one of: pending, in-progress, completed'
            }),
        priority: Joi.string()
            .valid('low', 'medium', 'high', 'critical')
            .optional()
            .messages({
                'any.only': 'Priority must be one of: low, medium, high, critical'
            }),
        dueDate: Joi.date()
            .iso()
            .optional()
            .allow(null)
            .messages({
                'date.iso': 'Due date must be a valid ISO date format'
            }),
        tags: Joi.array()
            .items(Joi.string().trim().min(1).max(50))
            .max(10)
            .unique()
            .optional()
            .messages({
                'array.max': 'Cannot have more than 10 tags',
                'array.unique': 'Tags must be unique',
                'string.max': 'Each tag cannot exceed 50 characters'
            }),
        isRecurring: Joi.boolean().optional(),
        recurringPattern: Joi.string()
            .valid('daily', 'weekly', 'monthly')
            .optional()
            .allow(null)
            .messages({
                'any.only': 'Recurring pattern must be one of: daily, weekly, monthly'
            })
    }).min(1).messages({
        'object.min': 'At least one field must be provided for update'
    }),

    // Query parameter validation
    taskQuery: Joi.object({
        page: Joi.number()
            .integer()
            .min(1)
            .default(1)
            .messages({
                'number.min': 'Page number must be at least 1'
            }),
        limit: Joi.number()
            .integer()
            .min(1)
            .max(100)
            .default(10)
            .messages({
                'number.min': 'Limit must be at least 1',
                'number.max': 'Limit cannot exceed 100'
            }),
        status: Joi.string()
            .valid('pending', 'in-progress', 'completed')
            .optional()
            .messages({
                'any.only': 'Status filter must be one of: pending, in-progress, completed'
            }),
        priority: Joi.string()
            .valid('low', 'medium', 'high', 'critical')
            .optional()
            .messages({
                'any.only': 'Priority filter must be one of: low, medium, high, critical'
            }),
        search: Joi.string()
            .trim()
            .max(100)
            .optional()
            .messages({
                'string.max': 'Search term cannot exceed 100 characters'
            }),
        tags: Joi.string()
            .optional()
            .messages({
                'string.base': 'Tags filter must be a string (comma-separated)'
            }),
        sortBy: Joi.string()
            .valid('createdAt', 'updatedAt', 'dueDate', 'priority', 'status', 'title')
            .default('createdAt')
            .messages({
                'any.only': 'Sort field must be one of: createdAt, updatedAt, dueDate, priority, status, title'
            }),
        sortOrder: Joi.string()
            .valid('asc', 'desc')
            .default('desc')
            .messages({
                'any.only': 'Sort order must be either asc or desc'
            }),
        dueDateFrom: Joi.date()
            .iso()
            .optional()
            .messages({
                'date.iso': 'Due date from must be a valid ISO date format'
            }),
        dueDateTo: Joi.date()
            .iso()
            .min(Joi.ref('dueDateFrom'))
            .optional()
            .messages({
                'date.iso': 'Due date to must be a valid ISO date format',
                'date.min': 'Due date to must be after due date from'
            })
    }),

    // Parameter validation (for route parameters)
    mongoId: Joi.object({
        id: Joi.string()
            .pattern(/^[0-9a-fA-F]{24}$/)
            .required()
            .messages({
                'string.pattern.base': 'Invalid ID format'
            })
    }),

    // Tag Management Schemas
    tagCreate: Joi.object({
        name: Joi.string()
            .trim()
            .min(1)
            .max(30)
            .required()
            .messages({
                'string.min': 'Tag name cannot be empty',
                'string.max': 'Tag name cannot exceed 30 characters'
            }),
        description: Joi.string()
            .trim()
            .max(200)
            .allow('')
            .optional()
            .messages({
                'string.max': 'Tag description cannot exceed 200 characters'
            }),
        color: Joi.string()
            .pattern(/^#[0-9A-F]{6}$/i)
            .default('#007bff')
            .optional()
            .messages({
                'string.pattern.base': 'Color must be a valid hex color code (e.g., #FF0000)'
            })
    }),

    tagUpdate: Joi.object({
        name: Joi.string()
            .trim()
            .min(1)
            .max(30)
            .optional()
            .messages({
                'string.min': 'Tag name cannot be empty',
                'string.max': 'Tag name cannot exceed 30 characters'
            }),
        description: Joi.string()
            .trim()
            .max(200)
            .allow('')
            .optional()
            .messages({
                'string.max': 'Tag description cannot exceed 200 characters'
            }),
        color: Joi.string()
            .pattern(/^#[0-9A-F]{6}$/i)
            .optional()
            .messages({
                'string.pattern.base': 'Color must be a valid hex color code (e.g., #FF0000)'
            })
    }).min(1).messages({
        'object.min': 'At least one field must be provided for update'
    }),

    tagQuery: Joi.object({
        page: Joi.number()
            .integer()
            .min(1)
            .default(1)
            .messages({
                'number.min': 'Page number must be at least 1'
            }),
        limit: Joi.number()
            .integer()
            .min(1)
            .max(100)
            .default(50)
            .messages({
                'number.min': 'Limit must be at least 1',
                'number.max': 'Limit cannot exceed 100'
            }),
        search: Joi.string()
            .trim()
            .max(100)
            .optional()
            .messages({
                'string.max': 'Search term cannot exceed 100 characters'
            }),
        sortBy: Joi.string()
            .valid('createdAt', 'updatedAt', 'name', 'usageCount')
            .default('createdAt')
            .messages({
                'any.only': 'Sort field must be one of: createdAt, updatedAt, name, usageCount'
            }),
        sortOrder: Joi.string()
            .valid('asc', 'desc')
            .default('desc')
            .messages({
                'any.only': 'Sort order must be either asc or desc'
            })
    })
};

/**
 * Pre-built validation middleware functions
 */
const validationMiddleware = {
    // Authentication validations
    validateUserRegister: validate(validationSchemas.userRegister),
    validateUserLogin: validate(validationSchemas.userLogin),

    // Task validations
    validateTaskCreate: validate(validationSchemas.taskCreate),
    validateTaskUpdate: validate(validationSchemas.taskUpdate),
    validateTaskQuery: validate(validationSchemas.taskQuery, 'query'),

    // Tag validations
    validateTagCreate: validate(validationSchemas.tagCreate),
    validateTagUpdate: validate(validationSchemas.tagUpdate),
    validateTagQuery: validate(validationSchemas.tagQuery, 'query'),

    // Parameter validations
    validateMongoId: validate(validationSchemas.mongoId, 'params')
};

module.exports = {
    validate,
    validationSchemas,
    validationMiddleware
}; 