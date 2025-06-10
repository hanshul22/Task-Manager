const express = require('express');
const dotenv = require('dotenv');
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./swagger.json');
const connectDB = require('./Config/DB');
const { errorHandler } = require('./Middleware/errorHandler');
const { securityStack } = require('./Middleware/securityMiddleware');

// Load environment variables
dotenv.config();

const PORT = process.env.PORT || 5000;

// Initialize Express app
const app = express();

// Connect to MongoDB
connectDB();

// Trust proxy (important for accurate IP addresses behind proxies)
app.set('trust proxy', 1);

// Apply security middleware stack
app.use(securityStack);

// Middleware to parse JSON
app.use(express.json({
  limit: process.env.JSON_LIMIT || '10mb',
  strict: true
}));
app.use(express.urlencoded({
  extended: true,
  limit: process.env.URL_ENCODED_LIMIT || '10mb'
}));

// Import routes
const authRoutes = require('./Routes/authRoutes');
const taskRoutes = require('./Routes/taskRoutes');

// Health check route
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Task Manager API is running...',
    data: {
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      endpoints: {
        auth: '/api/auth',
        tasks: '/api/tasks'
      },
    }
  });
});


// API documentation route
app.get('/api', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Task Manager API Documentation',
    data: {
      version: '1.0.0',
      baseUrl: `${req.protocol}://${req.get('host')}`,
      endpoints: {
        auth: {
          register: 'POST /api/auth/register',
          login: 'POST /api/auth/login',
          logout: 'POST /api/auth/logout',
          profile: 'GET /api/auth/me',
          updateProfile: 'PUT /api/auth/profile',
          changePassword: 'PUT /api/auth/password'
        },
        tasks: {
          getAllTasks: 'GET /api/tasks',
          createTask: 'POST /api/tasks',
          getTask: 'GET /api/tasks/:id',
          updateTask: 'PUT /api/tasks/:id',
          deleteTask: 'DELETE /api/tasks/:id',
          getStats: 'GET /api/tasks/stats',
          bulkUpdate: 'PATCH /api/tasks/bulk'
        }
      },
      authentication: 'Bearer token required for protected routes',
      rateLimits: {
        general: '100 requests per 15 minutes',
        login: '5 attempts per 15 minutes',
        creation: '20 requests per 5 minutes'
      },
      documentation: {
        swagger: `${req.protocol}://${req.get('host')}/api/docs`,
        postman: 'Available in repository'
      }
    }
  });
});

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);

// Swagger Documentation
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: "Task Manager API Documentation",
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    docExpansion: 'none',
    filter: true,
    showRequestHeaders: true,
    tryItOutEnabled: true
  }
}));

// Handle 404 errors
app.all('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
    statusCode: 404
  });
});

// Global error handler (must be last)
app.use(errorHandler);

// Graceful shutdown handler
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received. Shutting down gracefully...');
  process.exit(0);
});

// Start server
app.listen(PORT, () => {
  console.log(`
╭────────────────────────────────────────────────────────────────────╮
│     Task Manager API Server                                        │
├────────────────────────────────────────────────────────────────────┤
│ Port: ${PORT.toString().padEnd(27)}                                │
│ Environment: ${(process.env.NODE_ENV || 'development').padEnd(19)} │
│ Database: MongoDB                                                  │
│ Security: Enhanced                                                 │
╰────────────────────────────────────────────────────────────────────╯
  `);
  console.log(`🚀 Server running at: http://localhost:${PORT}`);
  console.log(`📚 API Documentation: http://localhost:${PORT}/api`);
  console.log(`📖 Swagger UI: http://localhost:${PORT}/api/docs`);

});
