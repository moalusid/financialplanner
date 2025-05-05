import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const AddDebt = () => {
    const navigate = useNavigate();
    const [debt, setDebt] = useState({ name: '', balance: '', interestRate: '', minPayment: '', paid: '' });

    const handleAddDebt = () => {
        const existingDebts = JSON.parse(localStorage.getItem('debts')) || [];
        const newDebt = {
            id: existingDebts.length + 1,
            name: debt.name || 'Unnamed Debt',
            balance: parseFloat(debt.balance) || 0,
            interestRate: parseFloat(debt.interestRate) || 0,
            minPayment: parseFloat(debt.minPayment) || 0,
            paid: parseFloat(debt.paid) || 0,
        };
        localStorage.setItem('debts', JSON.stringify([...existingDebts, newDebt]));
        navigate('/debt-management');
    };

    return (
        <div style={{ maxWidth: '600px', margin: '0 auto', fontFamily: 'Open Sans, sans-serif' }}>
            <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>Add Debt</h2>
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
                    placeholder="Balance"
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
                    style={{ width: '100%', marginBottom: '10px', padding: '8px' }}
                />
                <input
                    type="number"
                    placeholder="Amount Paid"
                    value={debt.paid}
                    onChange={(e) => setDebt({ ...debt, paid: e.target.value })}
                    style={{ width: '100%', marginBottom: '20px', padding: '8px' }}
                />
                <button
                    type="button"
                    onClick={handleAddDebt}
                    style={{ width: '100%', padding: '10px', marginBottom: '10px', backgroundColor: '#4caf50', color: '#fff', border: 'none', borderRadius: '5px' }}
                >
                    Add Debt
                </button>
            </form>
            <Link to="/debt-management">
                <button
                    style={{ width: '100%', padding: '10px', backgroundColor: '#f44336', color: '#fff', border: 'none', borderRadius: '5px' }}
                >
                    Back to Debt Management
                </button>
            </Link>
        </div>
    );
};

export default AddDebt;
