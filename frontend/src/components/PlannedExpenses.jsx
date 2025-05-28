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
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={tableStyle}>
                            <thead>
                                <tr>
                                    <th>Description</th>
                                    <th>Amount</th>
                                    <th>Due Date</th>
                                    <th>Classification</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {expenses.map(expense => (
                                    <tr 
                                        key={expense.id} 
                                        style={{
                                            backgroundColor: expense.status === 'completed' ? '#f8f9fa' : 'white'
                                        }}
                                    >
                                        <td>{expense.description}</td>
                                        <td>P{expense.amount.toLocaleString('en-BW', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                                        <td>{new Date(expense.due_date).toLocaleDateString('en-BW')}</td>
                                        <td>{expense.classification}</td>
                                        <td>{expense.status}</td>
                                        <td>
                                            {expense.status !== 'completed' && (
                                                <button
                                                    onClick={() => handleComplete(expense.id)}
                                                    style={{
                                                        padding: '8px 16px',
                                                        backgroundColor: '#007bff',
                                                        color: 'white',
                                                        border: 'none',
                                                        borderRadius: '4px',
                                                        cursor: 'pointer'
                                                    }}
                                                >
                                                    Mark as Paid
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
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
