const express = require('express');
const cors = require('cors');
const app = express();

// CORS Configuration
app.use(cors({
    origin: process.env.NODE_ENV === 'production' 
        ? 'https://yourproductiondomain.com' 
        : 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(err.status || 500).json({
        error: {
            message: err.message || 'Internal Server Error',
            status: err.status || 500
        }
    });
});

// ...existing code...

module.exports = app;