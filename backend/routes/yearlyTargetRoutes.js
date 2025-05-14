const express = require('express');
const router = express.Router();
const pool = require('../database/config'); // Assuming PostgreSQL is used

// Fetch all targets for a specific year
router.get('/', async (req, res) => {
    const { year } = req.query;

    try {
        const result = await pool.query(
            'SELECT * FROM yearly_targets WHERE year = $1',
            [year]
        );

        // Transform the data into the expected structure
        const transformedData = result.rows.reduce((acc, row) => {
            const { year, month, category, target } = row;
            if (!acc[year]) acc[year] = {};
            if (!acc[year][month]) acc[year][month] = {};
            acc[year][month][category] = parseFloat(target); // Ensure target is treated as a number
            return acc;
        }, {});

        res.json(transformedData);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch yearly targets' });
    }
});

module.exports = router;
