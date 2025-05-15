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
    const { name, balance, interestRate, minPayment, debtLimit, originalAmount, loanTerm, startDate, type } = req.body;

    try {
        const result = await pool.query(
            `UPDATE debts
             SET name = $1, balance = $2, interest_rate = $3, min_payment = $4, debt_limit = $5,
                 original_amount = $6, loan_term = $7, start_date = $8, type = $9
             WHERE id = $10 RETURNING *`,
            [name, balance, interestRate, minPayment, debtLimit, originalAmount, loanTerm, startDate, type, id]
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