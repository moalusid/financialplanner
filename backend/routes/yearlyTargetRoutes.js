const express = require('express');
const router = express.Router();
const pool = require('../database/config');

// Fetch targets for a specific year and optionally a specific month
router.get('/', async (req, res) => {
    const { year, month } = req.query;

    try {
        const query = month
            ? 'SELECT * FROM yearly_targets WHERE year = $1 AND month = $2'
            : 'SELECT * FROM yearly_targets WHERE year = $1';
        const params = month ? [year, month] : [year];
        
        const result = await pool.query(query, params);

        // Transform the data into the expected structure
        const transformedData = result.rows.reduce((acc, row) => {
            const { year, month, category, target } = row;
            if (!acc[year]) acc[year] = {};
            if (!acc[year][month]) acc[year][month] = {};
            acc[year][month][category] = target === '' ? '' : parseFloat(target);
            return acc;
        }, {});

        res.json(transformedData);
    } catch (error) {
        console.error('Error fetching yearly targets:', error);
        res.status(500).json({ error: 'Failed to fetch yearly targets' });
    }
});

// Update or insert targets for a specific month and year
router.post('/', async (req, res) => {
    const { year, month, targets } = req.body;

    if (!year || !month || !targets) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        // Delete existing targets for this year/month
        await pool.query(
            'DELETE FROM yearly_targets WHERE year = $1 AND month = $2',
            [year, month]
        );

        // Insert new targets using the correct column name "target"
        const insertPromises = Object.entries(targets).map(([category, value]) => {
            return pool.query(
                'INSERT INTO yearly_targets (year, month, category, target) VALUES ($1, $2, $3, $4)',
                [year, month, category, value]
            );
        });

        await Promise.all(insertPromises);
        res.json({ success: true });
    } catch (error) {
        console.error('Error updating yearly targets:', error);
        res.status(500).json({ 
            success: false,
            message: 'Failed to update targets',
            error: error.message 
        });
    }
});

module.exports = router;
