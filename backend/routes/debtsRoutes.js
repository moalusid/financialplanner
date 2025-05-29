const express = require('express');
const router = express.Router();
const pool = require('../database/config');

// Fetch all debts
router.get('/', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM debts ORDER BY id ASC');
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching debts:', error);
        res.status(500).json({ error: 'Failed to fetch debts' });
    }
});

// Fetch a specific debt
router.get('/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const result = await pool.query('SELECT * FROM debts WHERE id = $1', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Debt not found' });
        }
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error fetching debt:', error);
        res.status(500).json({ error: 'Failed to fetch debt' });
    }
});

// Update a specific debt
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const {
        name, type, balance, original_amount, loan_term,
        start_date, interest_rate, min_payment, debt_limit,
        payment_date  // Make sure to extract payment_date from request
    } = req.body;

    try {
        console.log('Updating debt with data:', req.body); // Debug log

        const result = await pool.query(
            `UPDATE debts 
             SET name = $1, type = $2, balance = $3, 
                 original_amount = $4, loan_term = $5,
                 start_date = $6, interest_rate = $7, 
                 min_payment = $8, debt_limit = $9,
                 payment_date = $10
             WHERE id = $11 
             RETURNING *`,
            [
                name, type, balance, original_amount, loan_term,
                start_date, interest_rate, min_payment, debt_limit,
                payment_date, // Add payment_date to query params
                id
            ]
        );

        if (result.rows.length > 0) {
            console.log('Updated debt:', result.rows[0]); // Debug log
            res.json(result.rows[0]);
        } else {
            res.status(404).json({ error: 'Debt not found' });
        }
    } catch (error) {
        console.error('Error updating debt:', error); // Debug log
        res.status(500).json({ error: 'Failed to update debt' });
    }
});

// Delete a specific debt
router.delete('/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const result = await pool.query('DELETE FROM debts WHERE id = $1 RETURNING *', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Debt not found' });
        }

        res.json({ message: 'Debt deleted successfully' });
    } catch (error) {
        console.error('Error deleting debt:', error);
        res.status(500).json({ error: 'Failed to delete debt' });
    }
});

module.exports = router;