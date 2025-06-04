//backend/database/config.js
require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'financial_planner',
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT || 5432,
});

// Test the connection
pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
});

// Log connection details (for debugging)
console.log('Database connection details:', {
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    // Don't log password
    port: process.env.DB_PORT
});

module.exports = pool;