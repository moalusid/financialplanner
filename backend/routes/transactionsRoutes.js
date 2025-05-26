const express = require('express');
const router = express.Router();
const pool = require('../database/config');
const transactionsController = require('../controllers/transactionsController'); // Updated path

// Fetch all transactions
router.get('/', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM transactions ORDER BY date DESC');
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching transactions:', error);
        res.status(500).json({ error: 'Failed to fetch transactions' });
    }
});

// Add a new transaction
router.post('/', async (req, res) => {
    console.log('Request body:', req.body);
    const { type, category, description, amount, date, classification } = req.body;

    try {
        const queryText = `
            INSERT INTO transactions 
            (type, category, description, amount, date, classification) 
            VALUES ($1, $2, $3, $4, $5, $6) 
            RETURNING *
        `;
        const values = [type, category, description, amount, date, classification];
        console.log('Query values:', values);
        
        const result = await pool.query(queryText, values);
        console.log('Inserted row:', result.rows[0]);
        
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ 
            error: 'Failed to save transaction', 
            details: error.message,
            body: req.body 
        });
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

// Add new endpoint for monthly income
router.get('/monthly-income/:year/:month', async (req, res) => {
    const client = await pool.connect();
    try {
        const { year, month } = req.params;
        console.log(`Calculating income for ${year}-${month}`);

        // First, check what's in the table for debugging
        const debugQuery = `
            SELECT * FROM transactions 
            WHERE EXTRACT(YEAR FROM date) = $1 
            AND EXTRACT(MONTH FROM date) = $2`;
        
        const debugResult = await client.query(debugQuery, [year, month]);
        console.log('Debug - Found transactions:', debugResult.rows);

        // Now do the actual income calculation
        const query = `
            SELECT COALESCE(SUM(amount), 0) as total_income 
            FROM transactions 
            WHERE EXTRACT(YEAR FROM date) = $1 
            AND EXTRACT(MONTH FROM date) = $2 
            AND type ILIKE 'income'`;  // Changed from category to type, added ILIKE for case-insensitive match
        
        const result = await client.query(query, [year, month]);
        console.log('Query result:', result.rows[0]);

        res.json({ totalIncome: parseFloat(result.rows[0].total_income) });
    } catch (err) {
        console.error('Error in monthly-income route:', err);
        res.status(500).json({ error: err.message });
    } finally {
        client.release();
    }
});

// Add the batch update route handler
router.put('/batch', async (req, res) => {
    const { updated, deleted } = req.body;
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // Handle updates
        for (const transaction of updated) {
            const { id, date, description, amount, type, category, classification } = transaction;
            if (id) {
                await client.query(
                    `UPDATE transactions 
                     SET date = $1, description = $2, amount = $3, type = $4, category = $5, classification = $6
                     WHERE id = $7`,
                    [date, description, amount, type, category, classification || null, id]
                );
            }
        }

        // Handle deletions
        if (deleted && deleted.length > 0) {
            const deletedIds = deleted.map(t => t.id).filter(Boolean);
            if (deletedIds.length > 0) {
                await client.query('DELETE FROM transactions WHERE id = ANY($1)', [deletedIds]);
            }
        }

        await client.query('COMMIT');
        res.json({ message: 'Batch update successful' });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error in batch update:', err);
        res.status(500).json({ error: 'Failed to update transactions' });
    } finally {
        client.release();
    }
});

module.exports = router;