# Task Manager API - Authentication System

A secure and scalable Task Manager API built with Node.js, Express, and MongoDB featuring JWT-based authentication.

## 🚀 Features

- **User Registration & Login** - Secure authentication system
- **JWT Token-based Auth** - Stateless authentication
- **Password Hashing** - Using bcrypt for secure password storage
- **Input Validation** - Comprehensive validation using Joi
- **Rate Limiting** - Protection against brute force attacks
- **Security Headers** - Helmet.js for enhanced security
- **Error Handling** - Centralized error handling with consistent responses

## 📋 Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or Atlas)
- npm or yarn

## 🛠️ Installation & Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd task-manager-api/Server
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env` file in the Server directory:
   ```env
   # Server Configuration
   PORT=5000
   NODE_ENV=development

   # Database Configuration  
   MONGO_URI=mongodb://localhost:27017/taskmanager

   # JWT Configuration
   JWT_SECRET=your_super_secret_jwt_key_here_make_it_very_long_and_secure_12345
   JWT_EXPIRE=30d

   # Rate Limiting
   RATE_LIMIT_WINDOW_MS=900000
   RATE_LIMIT_MAX_REQUESTS=100
   ```

4. **Start the server**
   ```bash
   # Development mode
   npm run dev

   # Production mode
   npm start
   ```

## 📚 API Endpoints

### Authentication Routes

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | `/api/auth/register` | Register new user | Public |
| POST | `/api/auth/login` | Login user | Public |
| GET | `/api/auth/me` | Get current user | Private |

### API Response Format

**Success Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_id",
      "name": "John Doe",
      "email": "john@example.com",
      "createdAt": "2024-01-01T00:00:00.000Z"
    },
    "token": "jwt_token_here"
  },
  "message": "Operation successful"
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    "Email is required",
    "Password must be at least 6 characters long"
  ],
  "statusCode": 400
}
```

## 🔧 API Usage Examples

### 1. Register User
```bash
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

### 2. Login User
```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

### 3. Get Current User (Protected Route)
```bash
GET /api/auth/me
Authorization: Bearer <jwt_token>
```

## 🔐 Authentication Flow

1. **Register/Login** - User provides credentials
2. **Token Generation** - Server generates JWT token
3. **Token Storage** - Client stores token securely
4. **Request Authentication** - Include token in Authorization header
5. **Token Verification** - Server verifies token for protected routes

## 🛡️ Security Features

- **Password Hashing** - bcrypt with salt rounds
- **JWT Tokens** - Secure stateless authentication
- **Rate Limiting** - 100 requests per 15 minutes per IP
- **Input Validation** - Joi schema validation
- **Security Headers** - Helmet.js middleware
- **CORS** - Cross-origin resource sharing configuration

## 📁 Project Structure

```
Server/
├── Config/
│   └── DB.js                 # Database configuration
├── Controller/
│   └── authController.js     # Authentication logic
├── Middleware/
│   ├── authMiddleware.js     # JWT authentication middleware
│   └── errorHandler.js      # Global error handler
├── Models/
│   └── UserModel.js         # User schema
├── Routes/
│   └── authRoutes.js        # Authentication routes
├── Utils/
│   ├── validation.js        # Input validation schemas
│   └── tokenUtils.js        # JWT token utilities
├── .env                     # Environment variables
├── index.js                 # Application entry point
└── package.json            # Dependencies and scripts
```

## 🧪 Testing with Postman

1. **Set Base URL**: `http://localhost:5000`
2. **Register User**: POST `/api/auth/register`
3. **Login User**: POST `/api/auth/login`
4. **Get Profile**: GET `/api/auth/me` (with Bearer token)

## 🚨 Error Codes

| Status Code | Description |
|-------------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request / Validation Error |
| 401 | Unauthorized |
| 404 | Not Found |
| 429 | Too Many Requests |
| 500 | Internal Server Error |

## 🔄 Development Scripts

- `npm run dev` - Start development server with nodemon
- `npm start` - Start production server
- `npm test` - Run tests (to be implemented)

## 📝 Next Steps

- [ ] Implement task management endpoints
- [ ] Add email notifications
- [ ] Add password reset functionality
- [ ] Implement user profile updates
- [ ] Add API documentation with Swagger
- [ ] Add unit and integration tests

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📄 License

This project is licensed under the ISC License.

---