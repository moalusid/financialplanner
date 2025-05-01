import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const BudgetDetails = ({ onUpdateTransactions, transactions }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editableTransactions, setEditableTransactions] = useState([...transactions]);

    const groupedByType = editableTransactions.reduce((acc, transaction) => {
        const { type, category } = transaction;
        if (!acc[type]) acc[type] = {};
        if (!acc[type][category]) acc[type][category] = [];
        acc[type][category].push(transaction);
        return acc;
    }, {});

    const totalIncome = editableTransactions
        .filter((t) => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);

    const totalExpenses = editableTransactions
        .filter((t) => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

    const remainingBudget = totalIncome - totalExpenses;

    const handleInputChange = (index, field, value) => {
        const updatedTransactions = [...editableTransactions];
        updatedTransactions[index][field] = field === 'amount' ? parseFloat(value) || 0 : value;
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
        <div style={{ maxWidth: '400px', margin: '0 auto', fontFamily: 'Open Sans, sans-serif' }}>
            <h2>Budget Details</h2>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
                <thead>
                    <tr>
                        <th style={{ borderBottom: '2px solid #000', textAlign: 'left', padding: '8px' }}>Category</th>
                        <th style={{ borderBottom: '2px solid #000', textAlign: 'left', padding: '8px' }}>Description</th>
                        <th style={{ borderBottom: '2px solid #000', textAlign: 'right', padding: '8px' }}>Amount (P)</th>
                    </tr>
                </thead>
                <tbody>
                    {['income', 'expense'].map((type) => (
                        <React.Fragment key={type}>
                            <tr>
                                <td
                                    colSpan="3"
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
                                    colSpan="3"
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
                                                            colSpan="2"
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
                                                                {/* Category total */}
                                                            P{groupedByType[type][category]
                                                                .reduce((sum, t) => sum + t.amount, 0)
                                                                .toLocaleString()}
                                                        </td>
                                                    </tr>
                                                    {groupedByType[type][category].map((transaction, index) => (
                                                        <tr key={index}>
                                                            <td style={{ padding: '4px' }}>
                                                                {isEditing ? (
                                                                    <input
                                                                        type="text"
                                                                        value={transaction.category}
                                                                        onChange={(e) =>
                                                                            handleInputChange(
                                                                                editableTransactions.indexOf(transaction),
                                                                                'category',
                                                                                e.target.value
                                                                            )
                                                                        }
                                                                    />
                                                                ) : (
                                                                    transaction.category
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
                        <td colSpan="2" style={{ fontWeight: 'bold', padding: '8px', border: '2px solid #000' }}>
                            Total Income
                        </td>
                        <td
                            style={{
                                textAlign: 'right',
                                fontWeight: 'bold',
                                padding: '8px',
                                border: '2px solid #000',
                            }}
                        >
                            P{totalIncome.toLocaleString()}
                        </td>
                    </tr>
                    <tr>
                        <td colSpan="2" style={{ fontWeight: 'bold', padding: '8px', border: '2px solid #000' }}>
                            Total Expenses
                        </td>
                        <td
                            style={{
                                textAlign: 'right',
                                fontWeight: 'bold',
                                padding: '8px',
                                border: '2px solid #000',
                            }}
                        >
                            P{totalExpenses.toLocaleString()}
                        </td>
                    </tr>
                    <tr>
                        <td colSpan="2" style={{ fontWeight: 'bold', padding: '8px', border: '2px solid #000' }}>
                            Remaining Budget
                        </td>
                        <td
                            style={{
                                textAlign: 'right',
                                fontWeight: 'bold',
                                padding: '8px',
                                border: '2px solid #000',
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
