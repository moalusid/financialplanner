import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const AddTransaction = ({ onAddTransaction }) => {
    const [transaction, setTransaction] = useState({
        type: '',
        category: '',
        description: '',
        amount: '',
        date: '', // Add date field
    });
    const navigate = useNavigate();

    const handleAddTransaction = (resetAfterAdd = true) => {
        if (!transaction.type || !transaction.category || !transaction.date) {
            alert('Please fill in all required fields.');
            return;
        }
        if (!transaction.amount) {
            alert('Please enter an amount.');
            return;
        }
        onAddTransaction({ ...transaction, amount: parseFloat(transaction.amount) });
        if (resetAfterAdd) {
            navigate('/budget-manager');
        } else {
            setTransaction({ type: '', category: '', description: '', amount: '', date: '' });
        }
    };

    return (
        <div style={{ margin: '0 auto', fontFamily: 'Open Sans, sans-serif' }}>
            <h2>Add Transaction</h2>
            <input
                type="date" // Move date picker to the first field
                value={transaction.date}
                onChange={(e) => setTransaction({ ...transaction, date: e.target.value })}
            />
            <select
                value={transaction.type}
                onChange={(e) => setTransaction({ ...transaction, type: e.target.value })}
            >
                <option value="" disabled>
                    Select Type
                </option>
                <option value="income">Income</option>
                <option value="expense">Expense</option>
            </select>
            <select
                value={transaction.category}
                onChange={(e) => setTransaction({ ...transaction, category: e.target.value })}
            >
                <option value="" disabled>
                    Select Category
                </option>
                <option value="Housing">Housing</option>
                <option value="Utilities">Utilities</option>
                <option value="Groceries">Groceries</option>
                <option value="Transportation">Transportation</option>
                <option value="Dining Out">Dining Out</option>
                <option value="Entertainment">Entertainment</option>
                <option value="Shopping">Shopping</option>
                <option value="Health & Fitness">Health & Fitness</option>
                <option value="Debt Payments">Debt Payments</option>
                <option value="Savings">Savings</option>
                <option value="Insurance">Insurance</option>
                <option value="Salary">Salary</option>
                <option value="Other Income">Other Income</option>
                <option value="Other">Other</option>
            </select>
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
                onChange={(e) => setTransaction({ ...transaction, amount: e.target.value })}
            />
            <button onClick={() => handleAddTransaction(true)}>Add Transaction</button>
            <button onClick={() => handleAddTransaction(false)}>Add and Enter Another</button>
            <Link to="/budget-manager">
                <button>Cancel</button>
            </Link>
        </div>
    );
};

export default AddTransaction;
