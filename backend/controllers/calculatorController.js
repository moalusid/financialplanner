const pool = require('../database/config');

exports.calculateLoan = async (req, res) => {
    try {
        const { loanAmount, interestRate, termMonths } = req.body;
        const monthlyRate = interestRate / 100 / 12;
        const monthlyPayment = (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, termMonths)) / 
                              (Math.pow(1 + monthlyRate, termMonths) - 1);
        const totalPayment = monthlyPayment * termMonths;
        const totalInterest = totalPayment - loanAmount;

        res.json({
            monthlyPayment: Math.round(monthlyPayment * 100) / 100,
            totalInterest: Math.round(totalInterest * 100) / 100,
            principal: loanAmount
        });
    } catch (error) {
        console.error('Error calculating loan:', error);
        res.status(500).json({ error: 'Error calculating loan details' });
    }
};

exports.getBanks = async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM banks ORDER BY name');
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching banks:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.getLoanProducts = async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM loan_products');
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching loan products:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.compareBankLoans = async (req, res) => {
    try {
        const { amount, months } = req.body;
        const products = await pool.query(`
            SELECT lp.*, b.name as bank_name 
            FROM loan_products lp
            JOIN banks b ON b.id = lp.bank_id
            WHERE $1 BETWEEN lp.min_amount AND lp.max_amount
            AND $2 BETWEEN lp.min_term AND lp.max_term
        `, [amount, months]);

        const comparison = products.rows.map(product => {
            const monthlyRate = product.apr / 100 / 12;
            const monthlyPayment = (amount * monthlyRate * Math.pow(1 + monthlyRate, months)) / 
                                 (Math.pow(1 + monthlyRate, months) - 1);
            const totalPayment = monthlyPayment * months;
            const totalInterest = totalPayment - amount;

            return {
                bankId: product.bank_id,
                bankName: product.bank_name,
                productId: product.id,
                productName: product.name,
                monthlyPayment: Math.round(monthlyPayment * 100) / 100,
                totalInterest: Math.round(totalInterest * 100) / 100,
                totalPayment: Math.round(totalPayment * 100) / 100,
                apr: product.apr
            };
        });

        res.json(comparison);
    } catch (error) {
        console.error('Error comparing loans:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

