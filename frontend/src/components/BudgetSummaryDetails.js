import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

const BudgetSummaryDetails = ({ onUpdateTransactions }) => {
    const location = useLocation();
    const [transactions, setTransactions] = useState(location.state?.transactions || []);
    const [isEditing, setIsEditing] = useState(false);

    const groupedByCategory = transactions.reduce((acc, transaction) => {
        const { category } = transaction;
        if (!acc[category]) acc[category] = [];
        acc[category].push(transaction);
        return acc;
    }, {});

    const handleInputChange = (index, field, value) => {
        const updatedTransactions = [...transactions];
        updatedTransactions[index][field] = field === 'amount' ? parseFloat(value) || 0 : value;
        setTransactions(updatedTransactions);
    };

    const handleSave = () => {
        onUpdateTransactions(transactions);
        setIsEditing(false);
    };

    return (
        <div>
            <h2>Budget Summary Details</h2>
            {Object.keys(groupedByCategory).map((category) => (
                <div key={category}>
                    <h3>{category}</h3>
                    {groupedByCategory[category].map((transaction, index) => (
                        <div key={index}>
                            {isEditing ? (
                                <>
                                    <input
                                        type="text"
                                        value={transaction.description}
                                        onChange={(e) =>
                                            handleInputChange(
                                                transactions.indexOf(transaction),
                                                'description',
                                                e.target.value
                                            )
                                        }
                                    />
                                    <input
                                        type="number"
                                        value={transaction.amount}
                                        onChange={(e) =>
                                            handleInputChange(
                                                transactions.indexOf(transaction),
                                                'amount',
                                                e.target.value
                                            )
                                        }
                                    />
                                    <select
                                        value={transaction.category}
                                        onChange={(e) =>
                                            handleInputChange(
                                                transactions.indexOf(transaction),
                                                'category',
                                                e.target.value
                                            )
                                        }
                                    >
                                        <option value="Housing">Housing</option>
                                        <option value="Utilities">Utilities</option>
                                        <option value="Groceries">Groceries</option>
                                        <option value="Transportation">Transportation</option>
                                        <option value="DiningOut">Dining Out</option>
                                        <option value="Entertainment">Entertainment</option>
                                        <option value="Shopping">Shopping</option>
                                        <option value="HealthFitness">Health & Fitness</option>
                                        <option value="DebtPayments">Debt Payments</option>
                                        <option value="Savings">Savings</option>
                                        <option value="Insurance">Insurance</option>
                                        <option value="Salary">Salary</option>
                                        <option value="OtherIncome">Other Income</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </>
                            ) : (
                                <>
                                    {transaction.description}: P{transaction.amount.toLocaleString()}
                                </>
                            )}
                        </div>
                    ))}
                </div>
            ))}
            {isEditing ? (
                <button onClick={handleSave}>Save Changes</button>
            ) : (
                <button onClick={() => setIsEditing(true)}>Edit</button>
            )}
            <Link to="/budget-manager">
                <button>Back to Budget Manager</button>
            </Link>
        </div>
    );
};

export default BudgetSummaryDetails;
