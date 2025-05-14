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

    const handleSaveDebt = async () => {
        if (!debt.name || !debt.balance || !debt.debtLimit || !debt.interestRate || !debt.minPayment) {
            alert('Please fill in all required fields.');
            return;
        }

        const newDebt = {
            type: 'Revolving Debt', // Set type to "Revolving Debt"
            name: debt.name,
            balance: parseFloat(debt.balance),
            debtLimit: parseFloat(debt.debtLimit),
            interestRate: parseFloat(debt.interestRate),
            minPayment: parseFloat(debt.minPayment),
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
