const express = require('express');
const router = express.Router();
const pool = require('../database/config');

// Get all debts
router.get('/', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM debts');
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching debts:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;