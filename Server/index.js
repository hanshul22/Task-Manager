const express = require('express');
const dotenv = require('dotenv');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const connectDB = require('./Config/DB');
const errorHandler = require('./Middleware/errorHandler');

// Load environment variables
dotenv.config();

const PORT = process.env.PORT || 5000;

// Initialize Express app
const app = express();

// Connect to MongoDB
connectDB();

// Security middleware
app.use(helmet()); // Set security headers
app.use(cors()); // Enable CORS

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.',
    statusCode: 429
  }
});

app.use(limiter);

// Middleware to parse JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Import routes
const authRoutes = require('./Routes/authRoutes');

// Basic route
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Task Manager API is running...',
    data: {
      version: '1.0.0',
      endpoints: {
        auth: '/api/auth',
        tasks: '/api/tasks (coming soon)'
      }
    }
  });
});

// Mount routes
app.use('/api/auth', authRoutes);

// Global error handler (must be last)
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});
