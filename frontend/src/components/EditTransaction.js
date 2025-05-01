import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

const EditTransaction = ({ onUpdateTransaction }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const [transaction, setTransaction] = useState(location.state?.transaction || {});

    const handleUpdateTransaction = () => {
        onUpdateTransaction(transaction);
        navigate('/budget-summary-details');
    };

    return (
        <div>
            <h2>Edit Transaction</h2>
            <select
                value={transaction.type}
                onChange={(e) => setTransaction({ ...transaction, type: e.target.value })}
            >
                <option value="income">Income</option>
                <option value="expense">Expense</option>
            </select>
            <input
                type="text"
                placeholder="Category"
                value={transaction.category}
                onChange={(e) => setTransaction({ ...transaction, category: e.target.value })}
            />
            <input
                type="text"
                placeholder="Description"
                value={transaction.description}
                onChange={(e) => setTransaction({ ...transaction, description: e.target.value })}
            />
            <input
                type="number"
                placeholder="Amount"
                value={transaction.amount}
                onChange={(e) => setTransaction({ ...transaction, amount: parseFloat(e.target.value) || 0 })}
            />
            <button onClick={handleUpdateTransaction}>Update Transaction</button>
            <Link to="/budget-summary-details">
                <button>Cancel</button>
            </Link>
        </div>
    );
};

export default EditTransaction;
