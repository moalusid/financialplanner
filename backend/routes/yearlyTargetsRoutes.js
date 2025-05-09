const express = require('express');
const router = express.Router();
const pool = require('../database/config');

// Get all yearly targets
router.get('/', async (req, res) => {
    try {
        // Test database connection
        const client = await pool.connect();
        client.release();

        // Execute query
        const result = await pool.query(`
            SELECT year, month, category, target
            FROM yearly_targets
        `);

        // Ensure response is sent
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching yearly targets:', error); // Log only errors
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;