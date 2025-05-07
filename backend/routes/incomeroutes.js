const express = require('express');
const router = express.Router();
const pool = require('../database/config');

//GET all income
router.get('/', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM income');
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching income data:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;