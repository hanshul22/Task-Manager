# Task Manager API Documentation

## 🚀 Quick Start

### Access Documentation
- **Swagger UI**: [http://localhost:5000/api/docs](http://localhost:5000/api/docs)
- **API Overview**: [http://localhost:5000/api](http://localhost:5000/api)
- **Health Check**: [http://localhost:5000/](http://localhost:5000/)

### Base URL
```
Development: http://localhost:5000
Production: https://api.taskmanager.com
```

---

## 📚 API Overview

The Task Manager API provides comprehensive task management functionality with user authentication, advanced filtering, pagination, and bulk operations.

### Key Features
- ✅ **JWT Authentication** - Secure token-based authentication
- ✅ **Task CRUD Operations** - Create, Read, Update, Delete tasks
- ✅ **Advanced Filtering** - Filter by status, priority, tags, due date
- ✅ **Pagination & Sorting** - Efficient data retrieval
- ✅ **Search Functionality** - Search across titles and descriptions
- ✅ **Bulk Operations** - Update multiple tasks at once
- ✅ **Task Statistics** - Get insights about your tasks
- ✅ **Rate Limiting** - Protection against abuse
- ✅ **Input Validation** - Comprehensive data validation

---

## 🔐 Authentication

### Authentication Flow
1. **Register** a new account or **Login** with existing credentials
2. Receive a **JWT token** in the response
3. Include the token in the `Authorization` header for protected routes:
   ```
   Authorization: Bearer <your-jwt-token>
   ```

### Token Management
- Tokens are stateless and contain user information
- Include tokens in all protected route requests
- Use the **logout** endpoint to blacklist tokens
- Tokens should be stored securely on the client side

---

## 📋 API Endpoints

### Authentication Endpoints
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/auth/register` | Register new user | No |
| POST | `/api/auth/login` | Login user | No |
| POST | `/api/auth/logout` | Logout user | Yes |
| GET | `/api/auth/me` | Get current user profile | Yes |
| PUT | `/api/auth/profile` | Update user profile | Yes |
| PUT | `/api/auth/password` | Change password | Yes |

### Task Management Endpoints
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/tasks` | Get all tasks (with filtering) | Yes |
| POST | `/api/tasks` | Create new task | Yes |
| GET | `/api/tasks/:id` | Get specific task | Yes |
| PUT | `/api/tasks/:id` | Update specific task | Yes |
| DELETE | `/api/tasks/:id` | Delete task (soft delete) | Yes |
| GET | `/api/tasks/stats` | Get task statistics | Yes |
| PATCH | `/api/tasks/bulk` | Bulk update tasks | Yes |

---

## 🔍 Advanced Filtering & Querying

### GET /api/tasks Query Parameters

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `status` | string | Filter by task status | `?status=completed` |
| `priority` | string | Filter by priority level | `?priority=high` |
| `page` | integer | Page number for pagination | `?page=2` |
| `limit` | integer | Items per page (max 100) | `?limit=20` |
| `sortBy` | string | Field to sort by | `?sortBy=dueDate` |
| `sortOrder` | string | Sort direction (asc/desc) | `?sortOrder=asc` |
| `search` | string | Search in title/description | `?search=project` |
| `tags` | string | Filter by tags (comma-separated) | `?tags=urgent,work` |
| `overdue` | boolean | Filter overdue tasks | `?overdue=true` |

### Example Queries
```bash
# Get completed tasks, sorted by due date
GET /api/tasks?status=completed&sortBy=dueDate&sortOrder=asc

# Search for tasks containing "project" with high priority
GET /api/tasks?search=project&priority=high

# Get overdue tasks with pagination
GET /api/tasks?overdue=true&page=1&limit=10

# Filter by multiple tags
GET /api/tasks?tags=work,urgent&sortBy=priority
```

---

## 📊 Response Format

All API responses follow a consistent format:

### Success Response
```json
{
  "success": true,
  "data": {
    // Response data here
  },
  "message": "Operation successful"
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description",
  "errors": [
    "Detailed error message 1",
    "Detailed error message 2"
  ],
  "statusCode": 400
}
```

### Pagination Response
```json
{
  "success": true,
  "data": {
    "tasks": [...],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalTasks": 47,
      "hasNextPage": true,
      "hasPrevPage": false
    }
  },
  "message": "Tasks retrieved successfully"
}
```

---

## 🔧 Using Swagger UI

### Getting Started
1. Start your server: `npm start`
2. Open [http://localhost:5000/api/docs](http://localhost:5000/api/docs)
3. Explore the interactive documentation

### Authentication in Swagger UI
1. Click the **"Authorize"** button at the top right
2. Enter your JWT token in the format: `Bearer <your-token>`
3. Click **"Authorize"** to authenticate
4. Now you can test protected endpoints

### Testing Endpoints
1. **Expand** any endpoint section
2. Click **"Try it out"** button
3. **Fill in** required parameters
4. Click **"Execute"** to send the request
5. **View** the response below

### Features Available
- ✅ **Interactive Testing** - Test all endpoints directly
- ✅ **Request/Response Examples** - See sample data
- ✅ **Schema Documentation** - Understand data structures
- ✅ **Authentication Support** - Test protected routes
- ✅ **Parameter Validation** - Real-time validation
- ✅ **Response Visualization** - Formatted JSON responses

---

## 📱 Rate Limiting

The API implements rate limiting to prevent abuse:

| Endpoint Type | Limit | Window |
|---------------|-------|--------|
| General API | 100 requests | 15 minutes |
| Login attempts | 5 attempts | 15 minutes |
| Registration | 10 requests | 15 minutes |
| Task creation | 20 requests | 5 minutes |
| Bulk operations | 5 requests | 10 minutes |

### Rate Limit Headers
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

---

## 🛡️ Security Features

### Implemented Security Measures
- **JWT Authentication** - Stateless, secure tokens
- **Password Hashing** - bcrypt with salt rounds
- **Rate Limiting** - Prevents brute force attacks
- **Input Validation** - Comprehensive request validation
- **CORS Protection** - Configured cross-origin policies
- **Helmet Security** - Security headers middleware
- **User Isolation** - Users can only access their own data

### Best Practices
- Always use HTTPS in production
- Store JWT tokens securely (not in localStorage)
- Implement token refresh mechanism
- Validate all user inputs
- Use environment variables for secrets

---

## 🔄 Error Handling

### HTTP Status Codes

| Code | Meaning | Description |
|------|---------|-------------|
| 200 | OK | Request successful |
| 201 | Created | Resource created successfully |
| 400 | Bad Request | Invalid request data |
| 401 | Unauthorized | Authentication required |
| 403 | Forbidden | Access denied |
| 404 | Not Found | Resource not found |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server error |

### Common Error Scenarios
- **Invalid JWT Token**: 401 Unauthorized
- **Missing Required Fields**: 400 Bad Request
- **Task Not Found**: 404 Not Found
- **Rate Limit Exceeded**: 429 Too Many Requests
- **Validation Errors**: 400 Bad Request with detailed errors

---

## 📝 Example Usage

### 1. User Registration & Login
```bash
# Register new user
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123"
  }'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'
```

### 2. Task Operations
```bash
# Create task
curl -X POST http://localhost:5000/api/tasks \
  -H "Authorization: Bearer <your-jwt-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Complete project documentation",
    "description": "Write comprehensive API documentation",
    "priority": "high",
    "dueDate": "2024-12-31T23:59:59.000Z",
    "tags": ["documentation", "project"]
  }'

# Get all tasks with filtering
curl -X GET "http://localhost:5000/api/tasks?status=pending&priority=high&page=1&limit=10" \
  -H "Authorization: Bearer <your-jwt-token>"

# Update task
curl -X PUT http://localhost:5000/api/tasks/64b2f9a1e8f9c123456789ab \
  -H "Authorization: Bearer <your-jwt-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "completed",
    "priority": "medium"
  }'
```

### 3. Advanced Operations
```bash
# Get task statistics
curl -X GET http://localhost:5000/api/tasks/stats \
  -H "Authorization: Bearer <your-jwt-token>"

# Bulk update tasks
curl -X PATCH http://localhost:5000/api/tasks/bulk \
  -H "Authorization: Bearer <your-jwt-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "taskIds": ["64b2f9a1e8f9c123456789ab", "64b2f9a1e8f9c123456789ac"],
    "updateData": {
      "status": "completed",
      "priority": "low"
    }
  }'
```

---

## 🚀 Development & Testing

### Running the Server
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Start production server
npm start
```

### Testing with Postman
1. Import the Postman collection from the repository
2. Set up environment variables for base URL and JWT token
3. Test all endpoints with sample data

### Environment Variables
```bash
# Required environment variables
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/taskmanager
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRE=30d
```

---

## 📞 Support & Resources

### Documentation Links
- **Swagger UI**: [http://localhost:5000/api/docs](http://localhost:5000/api/docs)
- **API Overview**: [http://localhost:5000/api](http://localhost:5000/api)
- **GitHub Repository**: [Link to your repository]

### Useful Tools
- **Postman**: API testing and collection sharing
- **MongoDB Compass**: Database visualization
- **JWT.io**: Token debugging and validation

### Getting Help
- Check the Swagger UI for interactive examples
- Review error messages for detailed validation feedback
- Ensure proper authentication headers are included
- Verify rate limits haven't been exceeded

---

