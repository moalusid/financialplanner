import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const BudgetDetails = ({ onUpdateTransactions, transactions }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editableTransactions, setEditableTransactions] = useState([]);
    const [currentMonthIndex, setCurrentMonthIndex] = useState(new Date().getMonth()); // Focus on current month
    const [currentYear, setCurrentYear] = useState(new Date().getFullYear()); // Track the current year
    const [loading, setLoading] = useState(true); // Add loading state
    const [error, setError] = useState(null); // Add error state

    useEffect(() => {
        // Fetch transactions dynamically based on the current month
        const fetchTransactions = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await fetch(`/api/transactions?month=${currentMonthIndex + 1}`); // Ensure this matches the backend route
                const contentType = response.headers.get('Content-Type');
                if (!response.ok || !contentType.includes('application/json')) {
                    const text = await response.text(); // Log the full response for debugging
                    throw new Error(`Failed to fetch transactions: ${response.statusText}. Response: ${text}`);
                }
                const data = await response.json();
                setEditableTransactions(data);
            } catch (error) {
                setError(error.message);
                console.error('Error fetching transactions:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchTransactions();
    }, [currentMonthIndex]);

    useEffect(() => {
        const filteredTransactions = transactions.filter((transaction) => {
            const transactionDate = new Date(transaction.date);
            return (
                transactionDate.getMonth() === currentMonthIndex &&
                transactionDate.getFullYear() === currentYear
            );
        });
        setEditableTransactions(filteredTransactions);
    }, [transactions, currentMonthIndex, currentYear]);

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

    const handlePrevious = () => {
        setCurrentMonthIndex((prev) => {
            if (prev === 0) {
                setCurrentYear((year) => year - 1); // Move to the previous year
                return 11; // Set month to December
            }
            return prev - 1;
        });
    };

    const handleNext = () => {
        setCurrentMonthIndex((prev) => {
            if (prev === 11) {
                setCurrentYear((year) => year + 1); // Move to the next year
                return 0; // Set month to January
            }
            return prev + 1;
        });
    };

    const filteredTransactions = editableTransactions.filter((transaction) => {
        const transactionDate = new Date(transaction.date);
        return (
            transactionDate.getMonth() === currentMonthIndex &&
            transactionDate.getFullYear() === currentYear // Ensure the year matches the selected year
        );
    });

    const groupedByType = filteredTransactions.reduce((acc, transaction) => {
        const { type, category, amount } = transaction;
        if (!acc[type]) acc[type] = {};
        if (!acc[type][category]) acc[type][category] = [];
        acc[type][category].push({
            ...transaction,
            amount: parseFloat(amount) || 0, // Ensure amount is a valid number
        });
        return acc;
    }, {});

    const totalIncome = Object.values(groupedByType.income || {}).flat().reduce((sum, t) => sum + t.amount, 0);
    const totalExpenses = Object.values(groupedByType.expense || {}).flat().reduce((sum, t) => sum + t.amount, 0);
    const remainingBudget = totalIncome - totalExpenses;

    const handleInputChange = (index, field, value) => {
        // Ensure the index exists in the array
        if (index < 0 || index >= editableTransactions.length) {
            console.error(`Invalid index: ${index}`);
            return;
        }

        const updatedTransactions = [...editableTransactions];
        const transaction = updatedTransactions[index];

        // Ensure the transaction exists before updating
        if (!transaction) {
            console.error(`Transaction not found at index: ${index}`);
            return;
        }

        // Update the specified field
        transaction[field] = field === 'amount' ? parseFloat(value) || 0 : value;

        setEditableTransactions(updatedTransactions);
    };

    const handleDeleteTransaction = (transactionToDelete) => {
        const updatedTransactions = editableTransactions.filter(
            (transaction) => transaction !== transactionToDelete
        );
        setEditableTransactions(updatedTransactions);
    };

    const handleSave = async () => {
        try {
            // Send updated transactions to the backend
            const response = await fetch('/api/transactions', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editableTransactions), // Send all updated transactions
            });

            if (!response.ok) {
                throw new Error(`Failed to save transactions: ${response.statusText}`);
            }

            // Fetch the updated transactions for the current month and year
            const updatedResponse = await fetch(`/api/transactions?month=${currentMonthIndex + 1}`);
            if (!updatedResponse.ok) {
                throw new Error(`Failed to fetch updated transactions: ${updatedResponse.statusText}`);
            }

            const updatedTransactions = await updatedResponse.json();
            setEditableTransactions(updatedTransactions); // Update the state with the saved transactions
            onUpdateTransactions(updatedTransactions); // Notify parent component of the changes
            setIsEditing(false); // Exit edit mode
        } catch (error) {
            console.error('Error saving transactions:', error);
            setError('Failed to save changes. Please try again.');
        }
    };

    const handleCancel = () => {
        // Restore original transactions for the current month and year
        const filteredTransactions = transactions.filter((transaction) => {
            const transactionDate = new Date(transaction.date);
            return (
                transactionDate.getMonth() === currentMonthIndex &&
                transactionDate.getFullYear() === currentYear
            );
        });
        setEditableTransactions(filteredTransactions); // Restore filtered transactions
        setIsEditing(false); // Exit edit mode
    };

    const formatDate = (dateString) => {
        const options = { day: '2-digit', month: 'short', year: 'numeric' };
        return new Date(dateString).toLocaleDateString('en-GB', options).replace(/ /g, '-');
    };

    const formatNumber = (number) => {
        // Ensure the number is valid and format it with comma separators
        if (isNaN(number)) return '0.00';
        return Number(number).toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });
    };

    if (loading) {
        return <div>Loading...</div>; // Display loading message
    }

    if (error) {
        return <div>Error: {error}</div>; // Display error message
    }

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto', fontFamily: 'Open Sans, sans-serif' }}>
            <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>Budget Details</h2>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                <button onClick={handlePrevious}>
                    &lt; Previous
                </button>
                <h3>{`${months[currentMonthIndex]} ${currentYear}`}</h3> {/* Display month and year */}
                <button onClick={handleNext}>
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
                                                            {formatNumber(
                                                                groupedByType[type][category].reduce(
                                                                    (sum, t) => sum + t.amount,
                                                                    0
                                                                )
                                                            )}
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
                                                                    formatDate(transaction.date)
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
                                                                    formatNumber(transaction.amount)
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
                            {formatNumber(totalIncome)}
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
                            {formatNumber(totalExpenses)}
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
                            {formatNumber(remainingBudget)}
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
