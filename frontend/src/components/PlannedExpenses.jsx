import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const PlannedExpenses = () => {
    const [expenses, setExpenses] = useState([]);
    const [newExpense, setNewExpense] = useState({
        description: '',
        amount: '',
        due_date: '',
        category: '', // Changed from 'Housing'
        classification: '',
        reminder_days: 7
    });
    const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
    const [currentYear, setCurrentYear] = useState(new Date().getYear() + 1900);
    const [showAllMonths, setShowAllMonths] = useState(false);

    useEffect(() => {
        fetchExpenses();
    }, [currentMonth, currentYear]);

    const fetchExpenses = async () => {
        try {
            const response = await axios.get('http://localhost:5000/api/planned-expenses');
            console.log('API Response:', response.data); // Debug log
            const formattedExpenses = response.data.map(expense => ({
                ...expense,
                amount: parseFloat(expense.amount)
            }));
            setExpenses(formattedExpenses);
        } catch (error) {
            console.error('Error details:', error.response?.data || error.message);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            console.log('Submitting expense:', newExpense); // Debug log
            const response = await axios.post('http://localhost:5000/api/planned-expenses', newExpense);
            console.log('Submit response:', response.data); // Debug log
            setNewExpense({
                description: '',
                amount: '',
                due_date: '',
                category: 'Housing',
                classification: '',
                reminder_days: 7
            });
            fetchExpenses();
        } catch (error) {
            console.error('Submit error details:', error.response?.data || error.message);
        }
    };

    const handleComplete = async (id) => {
        try {
            await axios.post(`http://localhost:5000/api/planned-expenses/${id}/complete`);
            fetchExpenses();
        } catch (error) {
            console.error('Complete error details:', error.response?.data || error.message);
        }
    };

    const handleCancel = async (id) => {
        try {
            await axios.delete(`http://localhost:5000/api/planned-expenses/${id}`);
            fetchExpenses();
        } catch (error) {
            console.error('Cancel error details:', error.response?.data || error.message);
        }
    };

    const groupExpensesByMonth = (expenses) => {
        const overdue = [];
        const completed = [];
        const byMonth = {};
        const today = new Date();
        
        expenses.forEach(expense => {
            if (expense.status === 'completed') {
                completed.push(expense);
                return;
            }
            if (expense.status === 'overdue') {
                overdue.push(expense);
                return;
            }

            const date = new Date(expense.due_date);
            // Calculate months from now
            const monthsAway = (date.getFullYear() - today.getFullYear()) * 12 + date.getMonth() - today.getMonth();
            const key = monthsAway;

            if (!byMonth[key]) {
                byMonth[key] = {
                    monthName: date.toLocaleString('default', { month: 'long', year: 'numeric' }),
                    expenses: [],
                    sortKey: monthsAway
                };
            }
            byMonth[key].expenses.push(expense);
        });

        // Sort months by distance from current month
        const sortedMonths = Object.values(byMonth)
            .sort((a, b) => a.sortKey - b.sortKey)
            .map(({ monthName, expenses }) => ({ monthName, expenses }));

        return { overdue, months: sortedMonths, completed };
    };

    const renderExpensesSection = () => {
        const { overdue, months, completed } = groupExpensesByMonth(expenses);
        const visibleMonths = showAllMonths ? months : months.slice(0, 3);

        return (
            <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                {/* Overdue Section */}
                {overdue.length > 0 && (
                    <div style={{ marginBottom: '20px' }}>
                        <h4 style={{ 
                            color: '#d32f2f',
                            padding: '10px',
                            backgroundColor: '#ffebee',
                            borderRadius: '4px'
                        }}>
                            Overdue ({overdue.length})
                        </h4>
                        {overdue.map(expense => renderExpenseBar(expense))}
                    </div>
                )}

                {/* Monthly Sections */}
                {visibleMonths.map((month, index) => (
                    <div key={month.monthName} style={{ 
                        marginBottom: '20px',
                        backgroundColor: '#f8f9fa',
                        borderRadius: '8px',
                        padding: '15px'
                    }}>
                        <h4 style={{ marginBottom: '10px' }}>
                            {month.monthName} ({month.expenses.length})
                        </h4>
                        {month.expenses.map(expense => renderExpenseBar(expense))}
                    </div>
                ))}

                {/* Show More/Less Button */}
                {months.length > 3 && (
                    <button
                        onClick={() => setShowAllMonths(!showAllMonths)}
                        style={{
                            width: '100%',
                            padding: '10px',
                            marginTop: '10px',
                            backgroundColor: '#e0e0e0',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer'
                        }}
                    >
                        {showAllMonths ? 'Show Less' : `Show ${months.length - 3} More Months`}
                    </button>
                )}

                {/* Completed Section */}
                {completed.length > 0 && (
                    <div style={{ 
                        marginTop: '20px',
                        marginBottom: '20px',
                        backgroundColor: '#e8f5e9',
                        borderRadius: '8px',
                        padding: '15px'
                    }}>
                        <h4 style={{ 
                            color: '#2e7d32',
                            marginBottom: '10px'
                        }}>
                            Completed ({completed.length})
                        </h4>
                        {completed.map(expense => renderExpenseBar(expense))}
                    </div>
                )}
            </div>
        );
    };

    const getBarWidth = (amount) => {
        const maxAmount = Math.max(...expenses.map(e => parseFloat(e.amount)));
        return maxAmount > 0 ? `${(parseFloat(amount) / maxAmount) * 100}%` : '0%';
    };

    const renderExpenseBar = (expense) => {
        // Format the date to dd-mmm
        const date = new Date(expense.due_date);
        const formattedDate = date.toLocaleDateString('en-US', { 
            day: '2-digit',
            month: 'short'
        });

        return (
            <div key={expense.id} style={{
                position: 'relative',
                height: '40px',
                marginBottom: '8px',
                backgroundColor: '#fff',
                borderRadius: '4px',
                border: '1px solid #ddd'
            }}>
                <div style={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    height: '100%',
                    width: '100%',
                    backgroundColor: expense.status === 'overdue' ? '#ffebee' : '#e3f2fd',
                    borderRadius: '4px'
                }}></div>
                <div style={{
                    position: 'relative',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0 15px',
                    height: '100%',
                    zIndex: 1
                }}>
                    <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                        <span style={{ 
                            minWidth: '70px',
                            color: '#666',
                            fontSize: '0.9em'
                        }}>{formattedDate}</span>
                        <span>{expense.description}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                        <span style={{ marginRight: '20px' }}>
                            P{expense.amount.toLocaleString('en-BW', {minimumFractionDigits: 2})}
                        </span>
                        {(expense.status === 'pending' || expense.status === 'overdue') && (
                            <>
                                <button
                                    onClick={() => handleComplete(expense.id)}
                                    style={{
                                        padding: '4px 8px',
                                        backgroundColor: expense.status === 'overdue' ? '#d32f2f' : '#007bff',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '4px',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Mark as Paid
                                </button>
                                <button
                                    onClick={() => handleCancel(expense.id)}
                                    style={{
                                        padding: '4px 8px',
                                        backgroundColor: '#6c757d',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '4px',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Cancel
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div style={{ 
            padding: '20px',
            maxWidth: '1200px',
            margin: '0 auto',
            fontFamily: 'Open Sans, sans-serif'
        }}>
            <h2 style={{ 
                textAlign: 'center',
                color: '#2c3e50',
                marginBottom: '30px',
                fontSize: '2em'
            }}>Planned Expenses</h2>
            
            <div style={{
                backgroundColor: '#f8f9fa',
                padding: '20px',
                borderRadius: '8px',
                marginBottom: '30px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}>
                <h3 style={{ color: '#2c3e50', marginBottom: '20px' }}>Add New Planned Expense</h3>
                <form onSubmit={handleSubmit} style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '15px'
                }}>
                    <input
                        style={inputStyle}
                        type="text"
                        placeholder="Description"
                        value={newExpense.description}
                        onChange={(e) => setNewExpense({...newExpense, description: e.target.value})}
                        required
                    />
                    <input
                        style={inputStyle}
                        type="number"
                        placeholder="Amount"
                        value={newExpense.amount}
                        onChange={(e) => setNewExpense({...newExpense, amount: e.target.value})}
                        required
                    />
                    <input
                        style={inputStyle}
                        type="date"
                        value={newExpense.due_date}
                        onChange={(e) => setNewExpense({...newExpense, due_date: e.target.value})}
                        required
                    />
                    <select
                        style={inputStyle}
                        value={newExpense.category}
                        onChange={(e) => setNewExpense({...newExpense, category: e.target.value})}
                        required
                    >
                        <option value="">Select Category</option>
                        <option value="Housing">Housing</option>
                        <option value="Utilities">Utilities</option>
                        <option value="Groceries">Groceries</option>
                        <option value="Transportation">Transportation</option>
                        <option value="Dining Out">Dining Out</option>
                        <option value="Entertainment">Entertainment</option>
                        <option value="Shopping">Shopping</option>
                        <option value="Health & Fitness">Health & Fitness</option>
                        <option value="Debt Payments">Debt Payments</option>
                        <option value="Insurance">Insurance</option>
                        <option value="Savings">Savings</option>
                        <option value="Other">Other</option>
                    </select>
                    <select
                        style={inputStyle}
                        value={newExpense.classification}
                        onChange={(e) => setNewExpense({...newExpense, classification: e.target.value})}
                        required
                    >
                        <option value="">Select Classification</option>
                        <option value="Essentials">Essentials</option>
                        <option value="Non Essentials">Non Essentials</option>
                        <option value="Savings">Savings</option>
                    </select>
                    <input
                        style={inputStyle}
                        type="number"
                        placeholder="Reminder Days"
                        value={newExpense.reminder_days}
                        onChange={(e) => setNewExpense({...newExpense, reminder_days: e.target.value})}
                        min="1"
                        max="30"
                        required
                    />
                    <button
                        type="submit"
                        style={{
                            padding: '10px 20px',
                            backgroundColor: '#4CAF50',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '16px',
                            transition: 'background-color 0.3s'
                        }}
                    >
                        Add Expense
                    </button>
                </form>
            </div>
            
            <div style={{
                backgroundColor: '#fff',
                padding: '20px',
                borderRadius: '8px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}>
                <h3 style={{ color: '#2c3e50', marginBottom: '20px' }}>
                    Upcoming Expenses ({expenses.length} items)
                </h3>
                {expenses.length === 0 ? (
                    <p style={{ textAlign: 'center', color: '#666' }}>
                        No planned expenses found for this period.
                    </p>
                ) : renderExpensesSection()}
            </div>
            
            <div style={{ textAlign: 'center', marginTop: '20px' }}>
                <Link
                    to="/budget-manager"
                    style={{
                        display: 'inline-block',
                        padding: '10px 20px',
                        backgroundColor: '#6c757d',
                        color: 'white',
                        textDecoration: 'none',
                        borderRadius: '4px',
                        transition: 'background-color 0.3s'
                    }}
                >
                    Back to Budget Manager
                </Link>
            </div>
        </div>
    );
};

const inputStyle = {
    padding: '10px',
    borderRadius: '4px',
    border: '1px solid #ddd',
    fontSize: '16px',
    width: '100%'
};

const tableStyle = {
    width: '100%',
    borderCollapse: 'collapse',
    marginTop: '10px',
    fontSize: '16px',
    textAlign: 'left',
    backgroundColor: 'white',
    borderRadius: '4px',
    overflow: 'hidden'
};

export default PlannedExpenses;
