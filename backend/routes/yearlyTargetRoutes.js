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
        console.error('Error fetching yearly targets:', error);
        res.status(500).json({ error: 'Failed to fetch yearly targets' });
    }
});

// Update or insert targets for a specific month and year
router.post('/', async (req, res) => {
    const { year, month, targets } = req.body;

    if (!year || !month || !targets) {
        console.error('Missing required fields:', { year, month, targets }); // Debugging log
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        // Iterate through the targets and upsert each category
        for (const [category, target] of Object.entries(targets)) {
            console.log(`Upserting target: year=${year}, month=${month}, category=${category}, target=${target}`); // Debugging log
            await pool.query(
                `
                INSERT INTO yearly_targets (year, month, category, target)
                VALUES ($1, $2, $3, $4)
                ON CONFLICT (year, month, category)
                DO UPDATE SET target = EXCLUDED.target
                `,
                [year, month, category, target]
            );
        }

        res.status(200).json({ message: 'Targets updated successfully' });
    } catch (error) {
        console.error('Error updating yearly targets:', error); // Debugging log
        res.status(500).json({ error: 'Failed to update yearly targets' });
    }
});

module.exports = router;
