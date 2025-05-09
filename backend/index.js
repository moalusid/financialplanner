require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const pool = require('./database/config');
const config = require('./database/config');
const calculatorRoutes = require('./routes/calculatorRoutes');
const incomeRoutes = require('./routes/incomeroutes');
const transactionsRoutes = require('./routes/transactionsRoutes'); // Import transactions route
const debtsRoutes = require('./routes/debtsRoutes');
const yearlyTargetsRoutes = require('./routes/yearlyTargetsRoutes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Global request logger
app.use((req, res, next) => {
    console.log(`Incoming Request: ${req.method} ${req.url}`); // Debugging log for all requests
    next();
});

// Routes
app.use('/api/calculator', calculatorRoutes);
app.use('/api/income', incomeRoutes);
app.use('/api/transactions', transactionsRoutes); // Register transactions route
app.use('/api/debts', debtsRoutes);
app.use('/api/yearly-targets', yearlyTargetsRoutes);
app.use('/api/yearlyTargets', yearlyTargetsRoutes); // Ensure this route is registered

// Serve React app
app.use(express.static(path.join(__dirname, '../frontend/build')));

// Catch-all route for React app
app.get('*', (req, res) => {
    if (!req.originalUrl.startsWith('/api')) {
        res.sendFile(path.join(__dirname, '../frontend/build', 'index.html'));
    }
});

//example route
app.get('/', (req, res) => {
    res.send('Financial Planner API is running');
}
);

//Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`); // Debugging log for server startup
});