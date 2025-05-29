const express = require('express');
const router = express.Router();
const pool = require('../database/config');

// Get all planned expenses with automatic status updates
router.get('/', async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Update overdue statuses
        await client.query(`
            UPDATE plannedexpenses 
            SET status = 'overdue'
            WHERE status = 'pending' 
            AND due_date < CURRENT_DATE
        `);

        const result = await client.query(`
            SELECT * FROM plannedexpenses 
            ORDER BY 
                CASE 
                    WHEN status = 'overdue' THEN 1
                    WHEN status = 'pending' THEN 2
                    ELSE 3
                END,
                due_date ASC
        `);

        await client.query('COMMIT');
        res.json(result.rows);
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Database error:', error);
        res.status(500).json({ error: 'Failed to fetch planned expenses' });
    } finally {
        client.release();
    }
});

// Add new planned expense
router.post('/', async (req, res) => {
    const { description, amount, due_date, category, classification, reminder_days } = req.body;
    try {
        const result = await pool.query(
            `INSERT INTO plannedexpenses 
            (description, amount, due_date, category, classification, reminder_days)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *`,
            [description, amount, due_date, category, classification, reminder_days]
        );
        console.log('Created planned expense:', result.rows[0]);
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ 
            error: 'Failed to create planned expense',
            details: error.message
        });
    }
});

// Mark planned expense as complete and create transaction
router.post('/:id/complete', async (req, res) => {
    const { id } = req.params;
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');
        
        const expenseResult = await client.query(
            'SELECT * FROM plannedexpenses WHERE id = $1 AND status = \'pending\'',
            [id]
        );

        if (expenseResult.rows.length === 0) {
            throw new Error('Planned expense not found or already completed');
        }

        const expense = expenseResult.rows[0];
        const currentDate = new Date();
        const scheduledDate = new Date(expense.due_date).toLocaleDateString('en-BW');
        const enhancedDescription = `${expense.description} (Scheduled for ${scheduledDate})`;

        // Simplified transaction creation without notes
        const transactionResult = await client.query(
            `INSERT INTO transactions 
            (type, category, description, amount, date, classification)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING id`,
            [
                'expense',
                expense.category,
                enhancedDescription,
                expense.amount,
                currentDate,
                expense.classification
            ]
        );

        // Update planned expense status with transaction link
        await client.query(
            `UPDATE plannedexpenses 
            SET status = 'completed', 
                completed_date = CURRENT_DATE,
                transaction_id = $1
            WHERE id = $2 AND status = 'pending'
            RETURNING *`,
            [transactionResult.rows[0].id, id]
        );

        await client.query('COMMIT');
        res.json({ 
            message: 'Expense marked as complete',
            transactionId: transactionResult.rows[0].id
        });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error completing planned expense:', error);
        res.status(500).json({ 
            error: 'Failed to complete planned expense',
            details: error.message
        });
    } finally {
        client.release();
    }
});

// Add new DELETE endpoint for cancelling planned expenses
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');
        
        const result = await client.query(
            'DELETE FROM plannedexpenses WHERE id = $1 RETURNING *',
            [id]
        );

        if (result.rows.length === 0) {
            throw new Error('Planned expense not found');
        }

        await client.query('COMMIT');
        res.json({ message: 'Expense cancelled successfully' });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error cancelling planned expense:', error);
        res.status(500).json({ 
            error: 'Failed to cancel planned expense',
            details: error.message 
        });
    } finally {
        client.release();
    }
});

module.exports = router;
