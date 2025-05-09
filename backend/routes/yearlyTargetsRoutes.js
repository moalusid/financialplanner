const express = require('express');
const router = express.Router();
const pool = require('../database/config');

// Get all yearly targets
router.get('/', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM yearly_targets');
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching yearly targets:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;