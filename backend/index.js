require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const pool = require('./database/config');
const calculatorRoutes = require('./routes/calculatorRoutes');
const incomeRoutes = require('./routes/incomeroutes');
const transactionsRoutes = require('./routes/transactionsRoutes');
const debtsRoutes = require('./routes/debtsRoutes'); // Ensure this is imported
const yearlyTargetRoutes = require('./routes/yearlyTargetRoutes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Add logging middleware
app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
});

// Routes
app.use('/api/calculator', calculatorRoutes);
app.use('/api/income', incomeRoutes);
app.use('/api/transactions', transactionsRoutes);
app.use('/api/debts', debtsRoutes); // Ensure this is registered
app.use('/api/yearlyTargets', yearlyTargetRoutes);

// Serve React app
app.use(express.static(path.join(__dirname, '../frontend/build')));

// Catch-all route for React app
app.get('*', (req, res) => {
    if (!req.originalUrl.startsWith('/api')) {
        res.sendFile(path.join(__dirname, '../frontend/build', 'index.html'));
    }
});

// Example route
app.get('/', (req, res) => {
    res.send('Financial Planner API is running');
});

// Basic test route
app.get('/api/test', (req, res) => {
    res.json({ status: 'API is working' });
});

// Test PostgreSQL connection
pool.query('SELECT NOW()', (err, res) => {
    if (err) {
        console.error('Error connecting to the database:', err);
    } else {
        console.log('Connected to PostgreSQL');
    }
});

// Error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: err.message });
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});