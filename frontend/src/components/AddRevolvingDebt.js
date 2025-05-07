import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const AddRevolvingDebt = () => {
    const [debt, setDebt] = useState({
        name: '',
        balance: 0,
        debtLimit: 0,
        interestRate: 0,
        minPayment: 0,
    });
    const navigate = useNavigate();

    const handleInputChange = (field, value) => {
        setDebt({ ...debt, [field]: value });
    };

    const handleSaveDebt = () => {
        const storedDebts = JSON.parse(localStorage.getItem('debts')) || [];
        const newDebt = { ...debt, id: Date.now(), type: 'revolving' };
        storedDebts.push(newDebt);
        localStorage.setItem('debts', JSON.stringify(storedDebts));
        navigate('/debt-management');
    };

    return (
        <div style={{ maxWidth: '600px', margin: '0 auto', fontFamily: 'Open Sans, sans-serif' }}>
            <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>Add Revolving Credit</h2>
            <label>
                <strong>Debt Name:</strong>
                <input
                    type="text"
                    value={debt.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    style={{ width: '100%', marginBottom: '10px', padding: '8px' }}
                />
            </label>
            <label>
                <strong>Debt Limit:</strong>
                <input
                    type="number"
                    value={debt.debtLimit}
                    onChange={(e) => handleInputChange('debtLimit', parseFloat(e.target.value) || 0)}
                    style={{ width: '100%', marginBottom: '10px', padding: '8px' }}
                />
            </label>
            <label>
                <strong>Current Balance:</strong>
                <input
                    type="number"
                    value={debt.balance}
                    onChange={(e) => handleInputChange('balance', parseFloat(e.target.value) || 0)}
                    style={{ width: '100%', marginBottom: '10px', padding: '8px' }}
                />
            </label>
            <label>
                <strong>Interest Rate (%):</strong>
                <input
                    type="number"
                    value={debt.interestRate}
                    onChange={(e) => handleInputChange('interestRate', parseFloat(e.target.value) || 0)}
                    style={{ width: '100%', marginBottom: '10px', padding: '8px' }}
                />
            </label>
            <label>
                <strong>Minimum Payment:</strong>
                <input
                    type="number"
                    value={debt.minPayment}
                    onChange={(e) => handleInputChange('minPayment', parseFloat(e.target.value) || 0)}
                    style={{ width: '100%', marginBottom: '10px', padding: '8px' }}
                />
            </label>
            <button
                onClick={handleSaveDebt}
                style={{
                    marginTop: '10px',
                    padding: '10px',
                    backgroundColor: '#4caf50',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '5px',
                }}
            >
                Save
            </button>
        </div>
    );
};

export default AddRevolvingDebt;
