const pool = require('../database/config'); // Update path to match where your database config file is

// ...existing functions...

const batchUpdate = async (req, res) => {
    const { updated, deleted } = req.body;
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // Handle updates
        for (const transaction of updated) {
            const { id, date, description, amount, type, category, classification } = transaction;
            if (id) {
                // Update existing transaction
                await client.query(
                    `UPDATE transactions 
                     SET date = $1, description = $2, amount = $3, type = $4, category = $5, classification = $6
                     WHERE id = $7`,
                    [date, description, amount, type, category, classification, id]
                );
            } else {
                // Insert new transaction
                await client.query(
                    `INSERT INTO transactions (date, description, amount, type, category, classification)
                     VALUES ($1, $2, $3, $4, $5, $6)`,
                    [date, description, amount, type, category, classification]
                );
            }
        }

        // Handle deletions
        if (deleted && deleted.length > 0) {
            const deletedIds = deleted.map(t => t.id).filter(id => id);
            if (deletedIds.length > 0) {
                await client.query(
                    'DELETE FROM transactions WHERE id = ANY($1)',
                    [deletedIds]
                );
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
};

module.exports = {
    batchUpdate,
    // ...other exports...
};