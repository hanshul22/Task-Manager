const express = require('express');
const dotenv = require('dotenv');
const connectDB = require('./Config/DB');
dotenv.config();

const PORT = process.env.PORT || 5000;
// Load environment variables

// Initialize Express app
const app = express();

// Connect to MongoDB
connectDB();

// Middleware to parse JSON
app.use(express.json());

// Basic route
app.get('/', (req, res) => {
  res.send('API is running...');
});


// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
