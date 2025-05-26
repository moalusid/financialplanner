import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const BudgetDetails = ({ onUpdateTransactions, transactions }) => {
    // Add new state for tracking deleted transactions
    const [deletedTransactions, setDeletedTransactions] = useState([]);
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
        const { type, category, classification, amount } = transaction;
        if (!acc[type]) acc[type] = {};
        if (type === 'expense') {
            const classif = classification || 'Unclassified';
            if (!acc[type][classif]) acc[type][classif] = {};
            if (!acc[type][classif][category]) acc[type][classif][category] = [];
            acc[type][classif][category].push({
                ...transaction,
                amount: Number(amount) || 0,
            });
        } else {
            if (!acc[type][category]) acc[type][category] = [];
            acc[type][category].push({
                ...transaction,
                amount: Number(amount) || 0,
            });
        }
        return acc;
    }, {});

    const totalIncome = Object.values(groupedByType.income || {}).flat().reduce((sum, t) => sum + t.amount, 0);
    const totalExpenses = Object.values(groupedByType.expense || {}).reduce((sum, classification) => {
        return sum + Object.values(classification).flat().reduce((catSum, t) => catSum + t.amount, 0);
    }, 0);
    const remainingBudget = totalIncome - totalExpenses;

    const handleInputChange = (index, field, value) => {
        const updatedTransactions = editableTransactions.map(transaction => {
            if (transaction.id === index) {
                return {
                    ...transaction,
                    // Store as number internally but allow empty string in input
                    [field]: field === 'amount' ? (value === '' ? 0 : Number(value)) : value
                };
            }
            return transaction;
        });
        setEditableTransactions(updatedTransactions);
    };

    const handleDeleteTransaction = (transactionToDelete) => {
        // Mark transaction for deletion
        setDeletedTransactions(prev => [...prev, transactionToDelete]);
        // Remove from current view
        const updatedTransactions = editableTransactions.filter(
            transaction => transaction.id !== transactionToDelete.id
        );
        setEditableTransactions(updatedTransactions);
    };

    const handleSave = async () => {
        try {
            // All transactions already have numbers for amounts, no need to format
            const response = await fetch('/api/transactions/batch', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    updated: editableTransactions,
                    deleted: deletedTransactions
                }),
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
            setEditableTransactions(updatedTransactions);
            setDeletedTransactions([]); // Clear deleted transactions after successful save
            onUpdateTransactions(updatedTransactions);
            setIsEditing(false);
        } catch (error) {
            console.error('Error saving transactions:', error);
            setError('Failed to save changes. Please try again.');
        }
    };

    const handleCancel = () => {
        // Restore original transactions and clear deleted transactions
        const filteredTransactions = transactions.filter((transaction) => {
            const transactionDate = new Date(transaction.date);
            return (
                transactionDate.getMonth() === currentMonthIndex &&
                transactionDate.getFullYear() === currentYear
            );
        });
        setEditableTransactions(filteredTransactions);
        setDeletedTransactions([]); // Clear deleted transactions on cancel
        setIsEditing(false);
    };

    const formatDate = (dateString) => {
        const options = { day: '2-digit', month: 'short', year: 'numeric' };
        return new Date(dateString).toLocaleDateString('en-GB', options).replace(/ /g, '-');
    };

    // Add this helper function to format dates for input fields
    const formatDateForInput = (dateString) => {
        const date = new Date(dateString);
        return date.toISOString().split('T')[0]; // Returns YYYY-MM-DD format
    };

    // Update formatNumber to handle display
    const formatNumber = (number) => {
        // Only format non-zero numbers for display
        if (number === 0) return '';
        return number.toLocaleString('en-US', {
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
                    &lt; Previous Month
                </button>
                <h3>{`${months[currentMonthIndex]} ${currentYear}`}</h3>
                <button onClick={handleNext}>
                    Next Month &gt;
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
                            {type === 'expense' ? (
                                <tr>
                                    <td colSpan={isEditing ? 4 : 3} style={{ padding: '0' }}>
                                        <div style={{ 
                                            backgroundColor: '#f5f5f5', // Changed from #f8d7da to light grey
                                            border: '2px solid #000',
                                            borderRadius: '4px',
                                            margin: '10px 0'
                                        }}>
                                            {/* Expenses Header */}
                                            <div style={{ 
                                                padding: '12px 16px',
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                borderBottom: '1px solid #dee2e6'
                                            }}>
                                                <h3 style={{ margin: 0 }}>Expenses</h3>
                                                <span style={{ fontWeight: 'bold' }}>{formatNumber(totalExpenses)}</span>
                                            </div>

                                            {/* Classifications Container */}
                                            <div style={{ padding: '16px' }}>
                                                {Object.entries(groupedByType[type] || {}).map(([classification, categories], index) => {
                                                    // Different background colors for each classification
                                                    const colors = {
                                                        'Priorities': '#e3f2fd', // Light blue
                                                        'Savings': '#e8f5e9',    // Light green
                                                        'Non Essentials': '#fce4ec', // Light pink
                                                        'Rewards': '#fff3e0',    // Light orange
                                                        'Unclassified': '#f5f5f5' // Light grey
                                                    };
                                                    
                                                    return (
                                                        <div key={classification} style={{ 
                                                            backgroundColor: colors[classification] || '#f5f5f5',
                                                            borderRadius: '4px',
                                                            marginBottom: '16px',
                                                            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                                                        }}>
                                                            <div style={{ 
                                                                padding: '8px 16px',
                                                                borderBottom: '1px solid #dee2e6',
                                                                display: 'flex',
                                                                justifyContent: 'space-between',
                                                                alignItems: 'center'
                                                            }}>
                                                                <h4 style={{ margin: 0 }}>{classification}</h4>
                                                                <span>{formatNumber(
                                                                    Object.values(categories).flat().reduce((sum, t) => sum + t.amount, 0)
                                                                )}</span>
                                                            </div>
                                                            <div style={{ padding: '8px' }}>
                                                                {Object.entries(categories).map(([category, transactions]) => (
                                                                    <div key={category} style={{ marginBottom: '8px' }}>
                                                                        <div style={{ 
                                                                            padding: '8px',
                                                                            backgroundColor: '#e9ecef',
                                                                            borderRadius: '4px',
                                                                            marginBottom: '4px',
                                                                            display: 'flex',
                                                                            justifyContent: 'space-between'
                                                                        }}>
                                                                            <strong>{category}</strong>
                                                                            <span style={{ marginRight: '5%' }}>{formatNumber(
                                                                                transactions.reduce((sum, t) => sum + t.amount, 0)
                                                                            )}</span>
                                                                        </div>
                                                                        {transactions.map((transaction, index) => (
                                                                            <div key={index} style={{ 
                                                                                display: 'flex', 
                                                                                justifyContent: 'space-between', 
                                                                                padding: '4px 0' 
                                                                            }}>
                                                                                <div style={{ flex: 1, paddingRight: '8px' }}>
                                                                                    {isEditing ? (
                                                                                        <input
                                                                                            type="date" // Make date the first editable field
                                                                                            value={formatDateForInput(transaction.date)}
                                                                                            onChange={(e) =>
                                                                                                handleInputChange(
                                                                                                    transaction.id,
                                                                                                    'date',
                                                                                                    e.target.value
                                                                                                )
                                                                                            }
                                                                                            style={{ width: '100%' }}
                                                                                        />
                                                                                    ) : (
                                                                                        formatDate(transaction.date)
                                                                                    )}
                                                                                </div>
                                                                                <div style={{ flex: 2, paddingRight: '8px' }}>
                                                                                    {isEditing ? (
                                                                                        <input
                                                                                            type="text"
                                                                                            value={transaction.description}
                                                                                            onChange={(e) =>
                                                                                                handleInputChange(
                                                                                                    transaction.id,
                                                                                                    'description',
                                                                                                    e.target.value
                                                                                                )
                                                                                            }
                                                                                            style={{ width: '100%' }}
                                                                                        />
                                                                                    ) : (
                                                                                        transaction.description
                                                                                    )}
                                                                                </div>
                                                                                <div style={{ 
                                                                                    flex: 1, 
                                                                                    paddingRight: '15%',
                                                                                    textAlign: 'right' 
                                                                                }}>
                                                                                    {isEditing ? (
                                                                                        <input
                                                                                            type="number"
                                                                                            // Show empty string when amount is 0
                                                                                            value={transaction.amount === 0 ? '' : transaction.amount}
                                                                                            onChange={(e) =>
                                                                                                handleInputChange(
                                                                                                    transaction.id,
                                                                                                    'amount',
                                                                                                    e.target.value
                                                                                                )
                                                                                            }
                                                                                            style={{ width: '100%' }}
                                                                                        />
                                                                                    ) : (
                                                                                        formatNumber(transaction.amount)
                                                                                    )}
                                                                                </div>
                                                                                {isEditing && (
                                                                                    <div style={{ textAlign: 'center' }}>
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
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                <tr>
                                    <td colSpan={isEditing ? 4 : 3} style={{ padding: '0' }}>
                                        <div style={{ 
                                            backgroundColor: '#f5f5f5',
                                            border: '2px solid #000',
                                            borderRadius: '4px',
                                            margin: '10px 0'
                                        }}>
                                            {/* Income Header */}
                                            <div style={{ 
                                                padding: '12px 16px',
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                borderBottom: '1px solid #dee2e6',
                                                backgroundColor: '#d8f3dc'
                                            }}>
                                                <h3 style={{ margin: 0 }}>Income</h3>
                                                <span style={{ fontWeight: 'bold' }}>{formatNumber(totalIncome)}</span>
                                            </div>

                                            {/* Income Categories Container */}
                                            <div style={{ padding: '16px' }}>
                                                {Object.entries(groupedByType[type] || {}).map(([category, transactions]) => (
                                                    <div key={category} style={{ 
                                                        backgroundColor: '#e8f5e9',
                                                        borderRadius: '4px',
                                                        marginBottom: '16px',
                                                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                                                    }}>
                                                        <div style={{ 
                                                            padding: '8px 16px',
                                                            borderBottom: '1px solid #dee2e6',
                                                            display: 'flex',
                                                            justifyContent: 'space-between',
                                                            alignItems: 'center'
                                                        }}>
                                                            <strong>{category}</strong>
                                                            <span style={{ marginRight: '5%' }}>{formatNumber(
                                                                transactions.reduce((sum, t) => sum + t.amount, 0)
                                                            )}</span>
                                                        </div>
                                                        <div style={{ padding: '8px' }}>
                                                            {transactions.map((transaction, index) => (
                                                                <div key={index} style={{ 
                                                                    display: 'flex', 
                                                                    justifyContent: 'space-between', 
                                                                    padding: '4px 0'
                                                                }}>
                                                                    <div style={{ flex: 1, paddingRight: '8px' }}>
                                                                        {isEditing ? (
                                                                            <input
                                                                                type="date"
                                                                                value={formatDateForInput(transaction.date)}
                                                                                onChange={(e) =>
                                                                                    handleInputChange(
                                                                                        transaction.id,
                                                                                        'date',
                                                                                        e.target.value
                                                                                    )
                                                                                }
                                                                                style={{ width: '100%' }}
                                                                            />
                                                                        ) : (
                                                                            formatDate(transaction.date)
                                                                        )}
                                                                    </div>
                                                                    <div style={{ flex: 2, paddingRight: '8px' }}>
                                                                        {isEditing ? (
                                                                            <input
                                                                                type="text"
                                                                                value={transaction.description}
                                                                                onChange={(e) =>
                                                                                    handleInputChange(
                                                                                        transaction.id,
                                                                                        'description',
                                                                                        e.target.value
                                                                                    )
                                                                                }
                                                                                style={{ width: '100%' }}
                                                                            />
                                                                        ) : (
                                                                            transaction.description
                                                                        )}
                                                                    </div>
                                                                    <div style={{ 
                                                                        flex: 1, 
                                                                        paddingRight: '15%',
                                                                        textAlign: 'right' 
                                                                    }}>
                                                                        {isEditing ? (
                                                                            <input
                                                                                type="number"
                                                                                // Show empty string when amount is 0
                                                                                value={transaction.amount === 0 ? '' : transaction.amount}
                                                                                onChange={(e) =>
                                                                                    handleInputChange(
                                                                                        transaction.id,
                                                                                        'amount',
                                                                                        e.target.value
                                                                                    )
                                                                                }
                                                                                style={{ width: '100%' }}
                                                                            />
                                                                        ) : (
                                                                            formatNumber(transaction.amount)
                                                                        )}
                                                                    </div>
                                                                    {isEditing && (
                                                                        <div style={{ textAlign: 'center' }}>
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
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            )}
                            {type === 'income' && <tr style={{ height: '20px' }}></tr>}
                        </React.Fragment>
                    ))}
                </tbody>
                <tfoot style={{ marginTop: '20px' }}>{/* Add margin to tfoot instead of using spacer tr */}
                    <tr>
                        <td
                            colSpan={isEditing ? 3 : 2}
                            style={{ 
                                fontWeight: 'bold', 
                                padding: '8px', 
                                border: '2px solid #000',
                                paddingTop: '20px' // Add padding to first row instead of using spacer
                            }}
                        >
                            Total Income
                        </td>
                        <td
                            style={{
                                textAlign: 'right',
                                fontWeight: 'bold',
                                padding: '8px',
                                paddingTop: '20px', // Add padding to first row instead of using spacer
                                border: '2px solid #000'
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
