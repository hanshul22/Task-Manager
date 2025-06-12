const Joi = require('joi');

// User registration validation schema
const validateUserRegistration = (data) => {
    const schema = Joi.object({
        name: Joi.string()
            .min(2)
            .max(50)
            .required()
            .messages({
                'string.empty': 'Name is required',
                'string.min': 'Name must be at least 2 characters long',
                'string.max': 'Name cannot be more than 50 characters',
                'any.required': 'Name is required'
            }),
        email: Joi.string()
            .email()
            .required()
            .messages({
                'string.empty': 'Email is required',
                'string.email': 'Please enter a valid email',
                'any.required': 'Email is required'
            }),
        password: Joi.string()
            .min(6)
            .required()
            .messages({
                'string.empty': 'Password is required',
                'string.min': 'Password must be at least 6 characters long',
                'any.required': 'Password is required'
            }),
        confirmPassword: Joi.string()
            .valid(Joi.ref('password'))
            .required()
            .messages({
                'any.only': 'Password confirmation does not match password',
                'any.required': 'Password confirmation is required'
            })
    });

    return schema.validate(data);
};


// User login validation schema
const validateUserLogin = (data) => {
    const schema = Joi.object({
        email: Joi.string()
            .email()
            .required()
            .messages({
                'string.empty': 'Email is required',
                'string.email': 'Please enter a valid email',
                'any.required': 'Email is required'
            }),
        password: Joi.string()
            .required()
            .messages({
                'string.empty': 'Password is required',
                'any.required': 'Password is required'
            })
    });

    return schema.validate(data);
};

// Task creation validation schema
const validateTaskCreation = (data) => {
    const schema = Joi.object({
        title: Joi.string()
            .min(1)
            .max(100)
            .required()
            .messages({
                'string.empty': 'Title is required',
                'string.min': 'Title must be at least 1 character long',
                'string.max': 'Title cannot be more than 100 characters',
                'any.required': 'Title is required'
            }),
        description: Joi.string()
            .max(1000)
            .allow('')
            .messages({
                'string.max': 'Description cannot be more than 1000 characters'
            }),
        status: Joi.string()
            .valid('pending', 'in-progress', 'completed', 'cancelled')
            .messages({
                'any.only': 'Status must be one of: pending, in-progress, completed, cancelled'
            }),
        priority: Joi.string()
            .valid('low', 'medium', 'high', 'critical')
            .messages({
                'any.only': 'Priority must be one of: low, medium, high, critical'
            }),
        dueDate: Joi.date()
            .min('now')
            .messages({
                'date.min': 'Due date must be in the future',
                'date.base': 'Due date must be a valid date'
            }),
        tags: Joi.array()
            .items(
                Joi.string()
                    .max(30)
                    .messages({
                        'string.max': 'Tag cannot be more than 30 characters'
                    })
            )
            .messages({
                'array.base': 'Tags must be an array'
            })
    });

    return schema.validate(data);
};

// Task update validation schema
const validateTaskUpdate = (data) => {
    const schema = Joi.object({
        title: Joi.string()
            .min(1)
            .max(100)
            .messages({
                'string.empty': 'Title cannot be empty',
                'string.min': 'Title must be at least 1 character long',
                'string.max': 'Title cannot be more than 100 characters'
            }),
        description: Joi.string()
            .max(1000)
            .allow('')
            .messages({
                'string.max': 'Description cannot be more than 1000 characters'
            }),
        status: Joi.string()
            .valid('pending', 'in-progress', 'completed', 'cancelled')
            .messages({
                'any.only': 'Status must be one of: pending, in-progress, completed, cancelled'
            }),
        priority: Joi.string()
            .valid('low', 'medium', 'high', 'critical')
            .messages({
                'any.only': 'Priority must be one of: low, medium, high, critical'
            }),
        dueDate: Joi.date()
            .min('now')
            .allow(null)
            .messages({
                'date.min': 'Due date must be in the future',
                'date.base': 'Due date must be a valid date'
            }),
        tags: Joi.array()
            .items(
                Joi.string()
                    .max(30)
                    .messages({
                        'string.max': 'Tag cannot be more than 30 characters'
                    })
            )
            .messages({
                'array.base': 'Tags must be an array'
            })
    });

    return schema.validate(data);
};

// Task query validation schema
const validateTaskQuery = (data) => {
    const schema = Joi.object({
        status: Joi.string()
            .valid('pending', 'in-progress', 'completed', 'cancelled'),
        priority: Joi.string()
            .valid('low', 'medium', 'high', 'critical'),
        page: Joi.number()
            .integer()
            .min(1)
            .messages({
                'number.base': 'Page must be a number',
                'number.min': 'Page must be at least 1'
            }),
        limit: Joi.number()
            .integer()
            .min(1)
            .max(100)
            .messages({
                'number.base': 'Limit must be a number',
                'number.min': 'Limit must be at least 1',
                'number.max': 'Limit cannot be more than 100'
            }),
        sortBy: Joi.string()
            .valid('createdAt', 'updatedAt', 'dueDate', 'priority', 'status', 'title'),
        sortOrder: Joi.string()
            .valid('asc', 'desc'),
        search: Joi.string()
            .max(100)
            .messages({
                'string.max': 'Search term cannot be more than 100 characters'
            }),
        tags: Joi.string()
            .messages({
                'string.base': 'Tags filter must be a string'
            }),
        overdue: Joi.boolean()
            .messages({
                'boolean.base': 'Overdue filter must be a boolean'
            })
    });

    return schema.validate(data);
};

module.exports = {
    validateUserRegistration,
    validateUserLogin,
    validateTaskCreation,
    validateTaskUpdate,
    validateTaskQuery
}; 