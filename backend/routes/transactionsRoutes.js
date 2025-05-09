const express = require('express');
const router = express.Router();
const pool = require('../database/config');

// Get all transactions
router.get('/', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT id, date, category, amount, type
            FROM transactions
        `);
        res.json(result.rows); // Send transactions data
    } catch (error) {
        console.error('Error fetching transactions:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update transactions
router.put('/', async (req, res) => {
    try {
        const transactions = req.body; // Expect an array of transactions
        if (!Array.isArray(transactions)) {
            return res.status(400).json({ error: 'Invalid request format. Expected an array of transactions.' });
        }

        const updatePromises = transactions.map(async (transaction) => {
            const { id, date, description, amount, type, category } = transaction;

            if (!id) {
                throw new Error('Transaction ID is required for updates.');
            }

            const query = `
                UPDATE transactions
                SET date = $1, description = $2, amount = $3, type = $4, category = $5
                WHERE id = $6
            `;
            const params = [date, description, amount, type, category, id];
            await pool.query(query, params);
        });

        await Promise.all(updatePromises); // Wait for all updates to complete
        res.status(200).json({ message: 'Transactions updated successfully.' });
    } catch (error) {
        console.error('Error updating transactions:', error.message);
        console.error('Stack trace:', error.stack);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;