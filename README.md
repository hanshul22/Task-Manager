# Task Manager API - Complete Backend Solution

A secure, scalable, and production-ready Task Manager API built with Node.js, Express, and MongoDB featuring comprehensive task management, JWT authentication, and advanced filtering capabilities.

## 🚀 Features

### Core Functionality
- **Complete CRUD Operations** - Create, read, update, delete tasks
- **User Authentication** - Secure JWT-based authentication system
- **Task Management** - Full task lifecycle management
- **Advanced Filtering** - Filter by status, date, priority, tags
- **Pagination & Sorting** - Efficient data retrieval
- **Tagging System** - Organize tasks with custom tags
- **Email Notifications** - Task reminders and notifications
- **Search Functionality** - Search across titles and descriptions
- **Bulk Operations** - Mark multiple tasks as complete
- **Priority Levels** - Low, Medium, High, Critical priority management
- **Due Date Tracking** - Overdue notifications and reminders

### Security & Performance
- **JWT Token Authentication** - Stateless authentication
- **Password Hashing** - Secure bcrypt password storage
- **Input Validation** - Comprehensive Joi validation
- **Rate Limiting** - Protection against abuse
- **Security Headers** - Helmet.js middleware
- **CORS Configuration** - Cross-origin resource sharing
- **Error Handling** - Centralized error management

## 📋 Prerequisites

- **Node.js** (v14 or higher)
- **MongoDB** (local installation or Atlas)
- **npm** or **yarn** package manager
- **Postman** (for API testing)

## 🛠️ Installation & Setup

### 1. Clone Repository
```bash
git clone <repository-url>
cd task-manager-api
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Configuration
Create a `.env` file in the root directory:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database Configuration  
MONGO_URI=mongodb://localhost:27017/taskmanager

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_here_make_it_very_long_and_secure_12345
JWT_EXPIRE=30d

# Email Configuration (Nodemailer)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Pagination Defaults
DEFAULT_PAGE_SIZE=10
MAX_PAGE_SIZE=100
```

### 4. Database Setup
```bash
# Start MongoDB locally
mongod

# Or use MongoDB Atlas (update MONGO_URI in .env)
```

### 5. Start Application
```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

## 📚 API Endpoints

### Base URL
- **Development**: `http://localhost:5000`
- **Production**: `https://task-manager-mckp.onrender.com`

### Authentication Routes

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | `/api/auth/register` | Register new user | Public |
| POST | `/api/auth/login` | Login user | Public |
| GET | `/api/auth/me` | Get current user profile | Private |
| PUT | `/api/auth/profile` | Update user profile | Private |
| POST | `/api/auth/logout` | Logout user | Private |
| POST | `/api/auth/forgot-password` | Request password reset | Public |
| POST | `/api/auth/reset-password` | Reset password | Public |

### Task Management Routes

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/api/tasks` | Get all user tasks | Private |
| GET | `/api/tasks/:id` | Get specific task | Private |
| POST | `/api/tasks` | Create new task | Private |
| PUT | `/api/tasks/:id` | Update specific task | Private |
| DELETE | `/api/tasks/:id` | Delete specific task | Private |
| PATCH | `/api/tasks/:id/status` | Update task status | Private |
| POST | `/api/tasks/bulk-update` | Bulk update tasks | Private |
| GET | `/api/tasks/search` | Search tasks | Private |
| GET | `/api/tasks/statistics` | Get task statistics | Private |

### Tag Management Routes

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/api/tags` | Get all user tags | Private |
| POST | `/api/tags` | Create new tag | Private |
| PUT | `/api/tags/:id` | Update tag | Private |
| DELETE | `/api/tags/:id` | Delete tag | Private |

## 🔧 API Usage Examples

### Authentication

#### 1. Register User
```bash
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "60d5ecb74b24c17b8c8e1234",
      "name": "John Doe",
      "email": "john@example.com",
      "createdAt": "2024-01-01T00:00:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "message": "User registered successfully"
}
```

#### 2. Login User
```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

### Task Management

#### 3. Create Task
```bash
POST /api/tasks
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "title": "Complete Project Documentation",
  "description": "Write comprehensive API documentation",
  "status": "pending",
  "priority": "high",
  "dueDate": "2024-12-31T23:59:59.000Z",
  "tags": ["work", "documentation", "urgent"]
}
```

#### 4. Get Tasks with Filtering
```bash
GET /api/tasks?status=pending&priority=high&page=1&limit=10&sortBy=dueDate&sortOrder=asc
Authorization: Bearer <jwt_token>
```

#### 5. Search Tasks
```bash
GET /api/tasks/search?q=documentation&tags=work,urgent
Authorization: Bearer <jwt_token>
```

#### 6. Bulk Update Tasks
```bash
POST /api/tasks/bulk-update
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "taskIds": ["60d5ecb74b24c17b8c8e1234", "60d5ecb74b24c17b8c8e5678"],
  "updates": {
    "status": "completed"
  }
}
```

## 📊 Query Parameters

### Task Filtering Options
- `status`: `pending`, `in-progress`, `completed`, `cancelled`
- `priority`: `low`, `medium`, `high`, `critical`
- `tags`: Comma-separated tag names
- `dueDate`: Date range filtering (`before`, `after`)
- `createdAt`: Date range filtering
- `overdue`: `true`, `false`

### Pagination & Sorting
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10, max: 100)
- `sortBy`: Field to sort by (`createdAt`, `dueDate`, `priority`, `status`)
- `sortOrder`: `asc` or `desc` (default: `desc`)

### Search Parameters
- `q`: Search query for title and description
- `tags`: Filter by specific tags
- `exact`: Exact match search (`true`, `false`)

## 🏗️ Project Structure

```
task-manager-api/
├── config/
│   ├── database.js           # MongoDB connection
│   ├── email.js             # Email configuration
│   └── swagger.js           # Swagger setup
├── controllers/
│   ├── authController.js    # Authentication logic
│   ├── taskController.js    # Task management logic
│   └── tagController.js     # Tag management logic
├── middlewares/
│   ├── authMiddleware.js    # JWT authentication
│   ├── errorHandler.js      # Global error handler
│   ├── rateLimiter.js       # Rate limiting
│   └── validation.js        # Input validation
├── models/
│   ├── User.js              # User schema
│   ├── Task.js              # Task schema
│   └── Tag.js               # Tag schema
├── routes/
│   ├── authRoutes.js        # Authentication routes
│   ├── taskRoutes.js        # Task routes
│   └── tagRoutes.js         # Tag routes
├── services/
│   ├── emailService.js      # Email notifications
│   ├── taskService.js       # Task business logic
│   └── notificationService.js # Notification logic
├── utils/
│   ├── validation.js        # Joi validation schemas
│   ├── tokenUtils.js        # JWT utilities
│   ├── dateUtils.js         # Date helper functions
│   └── responseUtils.js     # Response formatters
├── tests/
│   ├── auth.test.js         # Authentication tests
│   ├── tasks.test.js        # Task management tests
│   └── setup.js             # Test configuration
├── docs/
│   ├── swagger.json         # API documentation
│   └── postman-collection.json # Postman collection
├── .env.example             # Environment variables template
├── .gitignore               # Git ignore rules
├── package.json             # Dependencies and scripts
├── README.md                # Project documentation
└── index.js                 # Application entry point
```

## 🔐 Authentication Flow

1. **Registration/Login** → User provides credentials
2. **Token Generation** → Server creates JWT token
3. **Token Storage** → Client stores token securely
4. **Request Authentication** → Include `Bearer <token>` in Authorization header
5. **Token Verification** → Server validates token for protected routes
6. **Access Control** → User can only access their own tasks

## 📋 Response Formats

### Success Response
```json
{
  "success": true,
  "data": {
    "tasks": [...],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalItems": 47,
      "hasNext": true,
      "hasPrev": false
    }
  },
  "message": "Tasks retrieved successfully"
}
```

### Error Response
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    "Title is required",
    "Due date must be in the future"
  ],
  "statusCode": 400
}
```

## 🛡️ Security Features

- **JWT Authentication** - Secure token-based authentication
- **Password Hashing** - bcrypt with salt rounds
- **Input Validation** - Joi schema validation for all inputs
- **Rate Limiting** - 100 requests per 15 minutes per IP
- **Security Headers** - Helmet.js for enhanced security
- **CORS** - Configured cross-origin resource sharing
- **SQL Injection Protection** - Mongoose ODM protection
- **XSS Protection** - Input sanitization
- **Data Encryption** - Sensitive data encryption


### Testing with Postman
1. Import the Postman collection from `/docs/postman-collection.json`
2. Set environment variables:
   - `baseUrl`: `http://localhost:5000`
   - `token`: JWT token from login response
3. Run the collection to test all endpoints

## 📈 Performance Features

- **Database Indexing** - Optimized queries with proper indexes
- **Pagination** - Efficient data loading
- **Response Caching** - Cache frequently requested data
- **Query Optimization** - Optimized MongoDB queries
- **Connection Pooling** - Efficient database connections
- **Compression** - Gzip response compression

## 🚀 Deployment

### Environment Setup
```bash
# Set production environment variables
NODE_ENV=production
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/taskmanager
JWT_SECRET=production_secret_key
```

### Deployment Platforms
- **Render** - Easy deployment with automatic builds
- **Heroku** - Platform-as-a-service deployment
- **AWS** - Full cloud infrastructure
- **DigitalOcean** - VPS deployment

### Database
- **MongoDB Atlas** - Cloud MongoDB service
- **Local MongoDB** - Self-hosted database

## 📊 API Status Codes

| Status Code | Description | Usage |
|-------------|-------------|-------|
| 200 | OK | Successful GET, PUT requests |
| 201 | Created | Successful POST requests |
| 204 | No Content | Successful DELETE requests |
| 400 | Bad Request | Validation errors, malformed requests |
| 401 | Unauthorized | Missing or invalid authentication |
| 403 | Forbidden | Valid token but insufficient permissions |
| 404 | Not Found | Resource not found |
| 409 | Conflict | Duplicate resource creation |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server-side errors |

## 🔄 Development Scripts

```bash
# Development
npm run dev          # Start with nodemon
npm run start        # Production start
npm run test         # Run test suite
npm run test:watch   # Run tests in watch mode
npm run lint         # ESLint code checking
npm run format       # Prettier code formatting
npm run docs         # Generate API documentation
```

## 📝 Production Checklist

### Security
- [ ] Environment variables configured
- [ ] JWT secret is secure and unique
- [ ] Rate limiting enabled
- [ ] HTTPS enabled in production
- [ ] CORS properly configured
- [ ] Input validation on all endpoints
- [ ] Error messages don't expose sensitive data

### Performance
- [ ] Database indexes created
- [ ] Connection pooling configured
- [ ] Response compression enabled
- [ ] Monitoring and logging setup
- [ ] Health check endpoint available

### Code Quality
- [ ] All tests passing
- [ ] Code coverage > 80%
- [ ] ESLint rules followed
- [ ] No security vulnerabilities
- [ ] Documentation complete

## 📖 API Documentation

- **Swagger UI**: Available at `/api/docs` when server is running
- **Postman Collection**: Import from `/docs/postman-collection.json`
- **OpenAPI Spec**: Complete specification in `/docs/swagger.json`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Commit changes: `git commit -m 'feat(tasks): add bulk operations'`
4. Push to branch: `git push origin feature/new-feature`
5. Create Pull Request

### Commit Message Format
```
type(scope): description

Types: feat, fix, docs, style, refactor, test, chore
Scopes: auth, tasks, tags, api, config, docs

Examples:
feat(tasks): add bulk update functionality
fix(auth): resolve token expiration issue
docs(api): update swagger documentation
```

## 📞 Support & Resources

### Useful Libraries Used
- **express** - Web application framework
- **mongoose** - MongoDB object modeling
- **jsonwebtoken** - JWT implementation
- **bcryptjs** - Password hashing
- **joi** - Data validation
- **nodemailer** - Email notifications
- **helmet** - Security middleware
- **cors** - CORS handling
- **express-rate-limit** - Rate limiting
- **swagger-jsdoc** - API documentation

### Learning Resources
- [Express.js Documentation](https://expressjs.com/)
- [Mongoose Documentation](https://mongoosejs.com/)
- [JWT Best Practices](https://jwt.io/)
- [Node.js Security Checklist](https://blog.risingstack.com/node-js-security-checklist/)



## 📍 Links 

### Backend Deployment
- **Live API**: [https://task-manager-mckp.onrender.com](https://task-manager-mckp.onrender.com)
- **API Documentation**: [https://task-manager-mckp.onrender.com/api/docs](https://task-manager-mckp.onrender.com/api/docs)

- **Demo Video**: [https://drive.google.com/drive/folders/1vqVCyAPlYlADs1EjrtVWCTd65r4TWD_0?usp=sharing]

## Links 

*Built with ❤️ by Hanshul Kumawat*
