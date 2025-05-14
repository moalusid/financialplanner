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
    const { type, name, balance, debtLimit, interestRate, minPayment } = req.body;

    if (!type || !name || !balance || !debtLimit || !interestRate || !minPayment) {
        console.error('Missing required fields:', { type, name, balance, debtLimit, interestRate, minPayment }); // Debugging log
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        console.log('Inserting debt:', { type, name, balance, debtLimit, interestRate, minPayment }); // Debugging log
        const result = await pool.query(
            'INSERT INTO debts (type, name, balance, debt_limit, interest_rate, min_payment) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [type, name, balance, debtLimit, interestRate, minPayment]
        );
        console.log('Debt saved successfully:', result.rows[0]); // Debugging log
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error saving debt:', error); // Debugging log
        res.status(500).json({ error: 'Failed to save debt' });
    }
});

module.exports = router;