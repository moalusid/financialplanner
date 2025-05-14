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

// Add a new debt
router.post('/', async (req, res) => {
    const { type, name, originalAmount, duration, balance, interestRate, minPayment, startDate } = req.body;

    if (!type || !name || !originalAmount || !balance || !interestRate || !minPayment || !startDate) {
        console.error('Missing required fields:', { type, name, originalAmount, balance, interestRate, minPayment, startDate }); // Debugging log
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        console.log('Inserting debt:', { type, name, originalAmount, duration, balance, interestRate, minPayment, startDate }); // Debugging log
        const result = await pool.query(
            'INSERT INTO debts (type, name, original_amount, loan_term, balance, interest_rate, min_payment, start_date) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
            [type, name, originalAmount, duration, balance, interestRate, minPayment, startDate]
        );
        console.log('Debt saved successfully:', result.rows[0]); // Debugging log
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error saving debt:', error); // Debugging log
        res.status(500).json({ error: 'Failed to save debt' });
    }
});

module.exports = router;