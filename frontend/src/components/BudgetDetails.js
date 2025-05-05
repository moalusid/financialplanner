import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const BudgetDetails = ({ onUpdateTransactions, transactions }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editableTransactions, setEditableTransactions] = useState([...transactions]);

    const categories = [
        'Housing',
        'Utilities',
        'Groceries',
        'Transportation',
        'Dining Out',
        'Entertainment',
        'Shopping',
        'Health & Fitness',
        'Debt Payments',
        'Savings',
        'Insurance',
        'Salary',
        'Other Income',
        'Other',
    ];

    const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December',
    ];

    const [currentMonthIndex, setCurrentMonthIndex] = useState(new Date().getMonth()); // Focus on current month

    const handlePrevious = () => {
        setCurrentMonthIndex((prev) => Math.max(prev - 1, 0));
    };

    const handleNext = () => {
        setCurrentMonthIndex((prev) => Math.min(prev + 1, months.length - 1));
    };

    const filteredTransactions = editableTransactions.filter(
        (transaction) => new Date(transaction.date).getMonth() === currentMonthIndex
    );

    const groupedByType = filteredTransactions.reduce((acc, transaction) => {
        const { type, category } = transaction;
        if (!acc[type]) acc[type] = {};
        if (!acc[type][category]) acc[type][category] = [];
        acc[type][category].push(transaction);
        return acc;
    }, {});

    const totalIncome = filteredTransactions
        .filter((t) => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);

    const totalExpenses = filteredTransactions
        .filter((t) => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

    const remainingBudget = totalIncome - totalExpenses;

    const handleInputChange = (index, field, value) => {
        const updatedTransactions = [...editableTransactions];
        updatedTransactions[index][field] = field === 'amount' ? parseFloat(value) || 0 : value;
        setEditableTransactions(updatedTransactions);
    };

    const handleDeleteTransaction = (transactionToDelete) => {
        const updatedTransactions = editableTransactions.filter(
            (transaction) => transaction !== transactionToDelete
        );
        setEditableTransactions(updatedTransactions);
    };

    const handleSave = () => {
        onUpdateTransactions(editableTransactions);
        setIsEditing(false);
    };

    const handleCancel = () => {
        setEditableTransactions([...transactions]); // Restore original transactions
        setIsEditing(false); // Exit edit mode
    };

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto', fontFamily: 'Open Sans, sans-serif' }}>
            <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>Budget Details</h2>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                <button onClick={handlePrevious} disabled={currentMonthIndex === 0}>
                    &lt; Previous
                </button>
                <h3>{months[currentMonthIndex]}</h3>
                <button onClick={handleNext} disabled={currentMonthIndex === months.length - 1}>
                    Next &gt;
                </button>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
                <thead>
                    <tr>
                        <th style={{ borderBottom: '2px solid #000', textAlign: 'left', padding: '8px' }}>Date</th>
                        <th style={{ borderBottom: '2px solid #000', textAlign: 'left', padding: '8px' }}>Description</th>
                        <th style={{ borderBottom: '2px solid #000', textAlign: 'right', padding: '8px' }}>Amount (P)</th>
                        {isEditing && (
                            <th style={{ borderBottom: '2px solid #000', textAlign: 'center', padding: '8px' }}>Action</th>
                        )}
                    </tr>
                </thead>
                <tbody>
                    {['income', 'expense'].map((type) => (
                        <React.Fragment key={type}>
                            <tr>
                                <td
                                    colSpan={isEditing ? 4 : 3}
                                    style={{
                                        backgroundColor: type === 'income' ? '#d8f3dc' : '#f8d7da',
                                        fontWeight: 'bold',
                                        padding: '8px',
                                        border: '2px solid #000',
                                        borderBottom: 'none',
                                    }}
                                >
                                    {type === 'income' ? 'Income' : 'Expenses'}
                                </td>
                            </tr>
                            <tr>
                                <td
                                    colSpan={isEditing ? 4 : 3}
                                    style={{
                                        border: '2px solid #000',
                                        borderTop: 'none',
                                        padding: '0',
                                    }}
                                >
                                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                        {groupedByType[type] &&
                                            Object.keys(groupedByType[type]).map((category) => (
                                                <React.Fragment key={category}>
                                                    <tr>
                                                        <td
                                                            colSpan={isEditing ? 3 : 2}
                                                            style={{
                                                                backgroundColor: '#f1f1f1',
                                                                fontWeight: 'bold',
                                                                padding: '8px',
                                                            }}
                                                        >
                                                            {category}
                                                        </td>
                                                        <td
                                                            style={{
                                                                backgroundColor: '#f1f1f1',
                                                                fontWeight: 'bold',
                                                                padding: '8px',
                                                                textAlign: 'right',
                                                            }}
                                                        >
                                                            P{groupedByType[type][category]
                                                                .reduce((sum, t) => sum + t.amount, 0)
                                                                .toLocaleString()}
                                                        </td>
                                                    </tr>
                                                    {groupedByType[type][category].map((transaction, index) => (
                                                        <tr key={index}>
                                                            <td style={{ padding: '4px', textAlign: 'center' }}>
                                                                {isEditing ? (
                                                                    <input
                                                                        type="date" // Make date the first editable field
                                                                        value={transaction.date}
                                                                        onChange={(e) =>
                                                                            handleInputChange(
                                                                                editableTransactions.indexOf(transaction),
                                                                                'date',
                                                                                e.target.value
                                                                            )
                                                                        }
                                                                    />
                                                                ) : (
                                                                    transaction.date
                                                                )}
                                                            </td>
                                                            <td style={{ padding: '4px' }}>
                                                                {isEditing ? (
                                                                    <input
                                                                        type="text"
                                                                        value={transaction.description}
                                                                        onChange={(e) =>
                                                                            handleInputChange(
                                                                                editableTransactions.indexOf(transaction),
                                                                                'description',
                                                                                e.target.value
                                                                            )
                                                                        }
                                                                    />
                                                                ) : (
                                                                    transaction.description
                                                                )}
                                                            </td>
                                                            <td style={{ padding: '4px', textAlign: 'right' }}>
                                                                {isEditing ? (
                                                                    <input
                                                                        type="number"
                                                                        value={transaction.amount}
                                                                        onChange={(e) =>
                                                                            handleInputChange(
                                                                                editableTransactions.indexOf(transaction),
                                                                                'amount',
                                                                                e.target.value
                                                                            )
                                                                        }
                                                                    />
                                                                ) : (
                                                                    transaction.amount.toLocaleString()
                                                                )}
                                                            </td>
                                                            {isEditing && (
                                                                <td style={{ textAlign: 'center', padding: '4px' }}>
                                                                    <button
                                                                        onClick={() => handleDeleteTransaction(transaction)}
                                                                        style={{
                                                                            backgroundColor: 'red',
                                                                            color: 'white',
                                                                            border: 'none',
                                                                            borderRadius: '4px',
                                                                            cursor: 'pointer',
                                                                        }}
                                                                    >
                                                                        X
                                                                    </button>
                                                                </td>
                                                            )}
                                                        </tr>
                                                    ))}
                                                </React.Fragment>
                                            ))}
                                    </table>
                                </td>
                            </tr>
                            {type === 'income' && <tr style={{ height: '20px' }}></tr>} {/* Spacer between groups */}
                        </React.Fragment>
                    ))}
                </tbody>
                <tfoot>
                    <tr style={{ height: '20px' }}></tr> {/* Spacer between expenses and summary lines */}
                    <tr>
                        <td
                            colSpan={isEditing ? 3 : 2} // Adjust column span dynamically
                            style={{ fontWeight: 'bold', padding: '8px', border: '2px solid #000' }}
                        >
                            Total Income
                        </td>
                        <td
                            style={{
                                textAlign: 'right',
                                fontWeight: 'bold',
                                padding: '8px',
                                border: '2px solid #000', // Ensure right border is applied
                            }}
                        >
                            P{totalIncome.toLocaleString()}
                        </td>
                    </tr>
                    <tr>
                        <td
                            colSpan={isEditing ? 3 : 2} // Adjust column span dynamically
                            style={{ fontWeight: 'bold', padding: '8px', border: '2px solid #000' }}
                        >
                            Total Expenses
                        </td>
                        <td
                            style={{
                                textAlign: 'right',
                                fontWeight: 'bold',
                                padding: '8px',
                                border: '2px solid #000', // Ensure right border is applied
                            }}
                        >
                            P{totalExpenses.toLocaleString()}
                        </td>
                    </tr>
                    <tr>
                        <td
                            colSpan={isEditing ? 3 : 2} // Adjust column span dynamically
                            style={{ fontWeight: 'bold', padding: '8px', border: '2px solid #000' }}
                        >
                            Remaining Budget
                        </td>
                        <td
                            style={{
                                textAlign: 'right',
                                fontWeight: 'bold',
                                padding: '8px',
                                border: '2px solid #000', // Ensure right border is applied
                            }}
                        >
                            P{remainingBudget.toLocaleString()}
                        </td>
                    </tr>
                </tfoot>
            </table>
            {isEditing ? (
                <div>
                    <button onClick={handleSave}>Save Changes</button>
                    <button onClick={handleCancel} style={{ marginLeft: '10px' }}>Cancel</button>
                </div>
            ) : (
                <button onClick={() => setIsEditing(true)}>Edit</button>
            )}
            <Link to="/budget-manager">
                <button>Back to Budget Manager</button>
            </Link>
        </div>
    );
};

export default BudgetDetails;
