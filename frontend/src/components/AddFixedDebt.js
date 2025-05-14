import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const AddFixedDebt = () => {
    const navigate = useNavigate();
    const [debt, setDebt] = useState({
        name: '',
        originalAmount: '',
        duration: '',
        balance: '',
        interestRate: '',
        minPayment: '',
        startDate: '', // Add startDate field
    });

    const handleAddDebt = async () => {
        if (!debt.name || !debt.originalAmount || !debt.balance || !debt.interestRate || !debt.minPayment || !debt.startDate) {
            alert('Please fill in all required fields.');
            return;
        }

        const newDebt = {
            type: 'Fixed Debt', // Set type to "Fixed Debt"
            name: debt.name || 'Unnamed Debt',
            originalAmount: parseFloat(debt.originalAmount) || 0,
            duration: parseInt(debt.duration, 10) || 0,
            balance: parseFloat(debt.balance) || 0,
            interestRate: parseFloat(debt.interestRate) || 0,
            minPayment: parseFloat(debt.minPayment) || 0,
            startDate: debt.startDate, // Include startDate
        };

        try {
            const response = await fetch('/api/debts', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(newDebt),
            });

            if (!response.ok) {
                throw new Error('Failed to save debt');
            }

            alert('Debt added successfully!');
            navigate('/debt-management');
        } catch (error) {
            console.error('Error saving debt:', error);
            alert('An error occurred while saving the debt.');
        }
    };

    return (
        <div style={{ maxWidth: '600px', margin: '0 auto', fontFamily: 'Open Sans, sans-serif' }}>
            <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>Add Fixed-Term Debt</h2>
            <form>
                <input
                    type="text"
                    placeholder="Debt Name"
                    value={debt.name}
                    onChange={(e) => setDebt({ ...debt, name: e.target.value })}
                    style={{ width: '100%', marginBottom: '10px', padding: '8px' }}
                />
                <input
                    type="number"
                    placeholder="Original Debt Amount"
                    value={debt.originalAmount}
                    onChange={(e) => setDebt({ ...debt, originalAmount: e.target.value })}
                    style={{ width: '100%', marginBottom: '10px', padding: '8px' }}
                />
                <input
                    type="date" // Move date picker for start date here
                    placeholder="Loan Start Date dd/mm/yyyy"
                    value={debt.startDate}
                    onChange={(e) => setDebt({ ...debt, startDate: e.target.value })}
                    style={{ width: '100%', marginBottom: '10px', padding: '8px' }}
                />
                <input
                    type="number"
                    placeholder="Duration of Debt (Months)"
                    value={debt.duration}
                    onChange={(e) => setDebt({ ...debt, duration: e.target.value })}
                    style={{ width: '100%', marginBottom: '10px', padding: '8px' }}
                />
                <input
                    type="number"
                    placeholder="Current Debt Balance"
                    value={debt.balance}
                    onChange={(e) => setDebt({ ...debt, balance: e.target.value })}
                    style={{ width: '100%', marginBottom: '10px', padding: '8px' }}
                />
                <input
                    type="number"
                    placeholder="Interest Rate (%)"
                    value={debt.interestRate}
                    onChange={(e) => setDebt({ ...debt, interestRate: e.target.value })}
                    style={{ width: '100%', marginBottom: '10px', padding: '8px' }}
                />
                <input
                    type="number"
                    placeholder="Minimum Payment"
                    value={debt.minPayment}
                    onChange={(e) => setDebt({ ...debt, minPayment: e.target.value })}
                    style={{ width: '100%', marginBottom: '20px', padding: '8px' }}
                />
                <button
                    type="button"
                    onClick={handleAddDebt}
                    style={{
                        width: '100%',
                        padding: '10px',
                        marginBottom: '10px',
                        backgroundColor: '#4caf50',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '5px',
                    }}
                >
                    Add Debt
                </button>
            </form>
            <Link to="/debt-management">
                <button
                    style={{
                        width: '100%',
                        padding: '10px',
                        backgroundColor: '#f44336',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '5px',
                    }}
                >
                    Back to Debt Management
                </button>
            </Link>
        </div>
    );
};

export default AddFixedDebt;
