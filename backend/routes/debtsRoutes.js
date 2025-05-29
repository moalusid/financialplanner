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
        name, balance, original_amount, interest_rate, min_payment, 
        loan_term, start_date, debt_limit, payment_date, category 
    } = req.body;

    try {
        const result = await pool.query(
            `UPDATE debts 
             SET name = $1, balance = $2, original_amount = $3, 
                 interest_rate = $4, min_payment = $5, loan_term = $6, 
                 start_date = $7, debt_limit = $8, payment_date = $9,
                 category = $10
             WHERE id = $11 
             RETURNING *`,
            [name, balance, original_amount, interest_rate, min_payment, 
             loan_term, start_date, debt_limit, payment_date, category, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Debt not found' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error updating debt:', error);
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