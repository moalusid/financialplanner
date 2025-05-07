import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';

const DebtDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [debt, setDebt] = useState(null);
    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => {
        const storedDebts = JSON.parse(localStorage.getItem('debts')) || [];
        const selectedDebt = storedDebts.find((debt) => debt.id === parseInt(id, 10));
        setDebt(selectedDebt);
    }, [id]);

    const handleSaveChanges = () => {
        const storedDebts = JSON.parse(localStorage.getItem('debts')) || [];
        const updatedDebts = storedDebts.map((d) => {
            if (d.id === debt.id) {
                // Only update the fields relevant to the current debt
                return {
                    ...d,
                    name: debt.name,
                    balance: debt.balance,
                    interestRate: debt.interestRate,
                    minPayment: debt.minPayment,
                    ...(debt.type === 'revolving' && { debtLimit: debt.debtLimit }),
                    ...(debt.type !== 'revolving' && { originalAmount: debt.originalAmount, loanTerm: debt.loanTerm }),
                };
            }
            return d;
        });
        localStorage.setItem('debts', JSON.stringify(updatedDebts));
        setIsEditing(false);
    };

    const handleDeleteDebt = () => {
        const storedDebts = JSON.parse(localStorage.getItem('debts')) || [];
        const updatedDebts = storedDebts.filter((d) => d.id !== debt.id);
        localStorage.setItem('debts', JSON.stringify(updatedDebts));
        navigate('/debt-management');
    };

    if (!debt) {
        return <p>Loading...</p>;
    }

    const originalAmount = debt.originalAmount || 0; // Fallback for undefined originalAmount
    const amountPaid = debt.type === 'revolving'
        ? debt.debtLimit - debt.balance
        : originalAmount - debt.balance;

    const percentagePaid = debt.type === 'revolving'
        ? (1 - (debt.balance / debt.debtLimit)) * 100
        : (amountPaid / originalAmount) * 100;

    return (
        <div style={{ maxWidth: '600px', margin: '0 auto', fontFamily: 'Open Sans, sans-serif' }}>
            <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>Debt Details</h2>
            {isEditing ? (
                <>
                    <label>
                        <strong>Debt Name:</strong>
                        <input
                            type="text"
                            value={debt.name}
                            onChange={(e) => setDebt({ ...debt, name: e.target.value })}
                            style={{ width: '100%', marginBottom: '10px', padding: '8px' }}
                        />
                    </label>
                    {debt.type === 'revolving' && (
                        <label>
                            <strong>Debt Limit:</strong>
                            <input
                                type="number"
                                value={debt.debtLimit}
                                onChange={(e) => setDebt({ ...debt, debtLimit: parseFloat(e.target.value) || 0 })}
                                style={{ width: '100%', marginBottom: '10px', padding: '8px' }}
                            />
                        </label>
                    )}
                    {debt.type !== 'revolving' && (
                        <>
                            <label>
                                <strong>Original Loan Amount:</strong>
                                <input
                                    type="number"
                                    value={debt.originalAmount}
                                    onChange={(e) => setDebt({ ...debt, originalAmount: parseFloat(e.target.value) || 0 })}
                                    style={{ width: '100%', marginBottom: '10px', padding: '8px' }}
                                />
                            </label>
                            <label>
                                <strong>Loan Term (Months):</strong>
                                <input
                                    type="number"
                                    value={debt.loanTerm}
                                    onChange={(e) => setDebt({ ...debt, loanTerm: parseInt(e.target.value, 10) || 0 })}
                                    style={{ width: '100%', marginBottom: '10px', padding: '8px' }}
                                />
                            </label>
                            <label>
                                <strong>Start Date:</strong>
                                <input
                                    type="date"
                                    value={debt.startDate}
                                    onChange={(e) => setDebt({ ...debt, startDate: e.target.value })}
                                    style={{ width: '100%', marginBottom: '10px', padding: '8px' }}
                                />
                            </label>
                        </>
                    )}
                    <label>
                        <strong>Current Balance:</strong>
                        <input
                            type="number"
                            value={debt.balance}
                            onChange={(e) => setDebt({ ...debt, balance: parseFloat(e.target.value) || 0 })}
                            style={{ width: '100%', marginBottom: '10px', padding: '8px' }}
                        />
                    </label>
                    <label>
                        <strong>Interest Rate (%):</strong>
                        <input
                            type="number"
                            value={debt.interestRate}
                            onChange={(e) => setDebt({ ...debt, interestRate: parseFloat(e.target.value) || 0 })}
                            style={{ width: '100%', marginBottom: '10px', padding: '8px' }}
                        />
                    </label>
                    <label>
                        <strong>Minimum Payment:</strong>
                        <input
                            type="number"
                            value={debt.minPayment}
                            onChange={(e) => setDebt({ ...debt, minPayment: parseFloat(e.target.value) || 0 })}
                            style={{ width: '100%', marginBottom: '10px', padding: '8px' }}
                        />
                    </label>
                    <button
                        onClick={handleSaveChanges}
                        style={{
                            marginTop: '10px',
                            padding: '10px',
                            backgroundColor: '#4caf50',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '5px',
                            marginRight: '10px',
                        }}
                    >
                        Save
                    </button>
                    <button
                        onClick={() => setIsEditing(false)}
                        style={{
                            marginTop: '10px',
                            padding: '10px',
                            backgroundColor: '#f44336',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '5px',
                        }}
                    >
                        Cancel
                    </button>
                </>
            ) : (
                <>
                    <p><strong>Name:</strong> {debt.name || 'Unnamed Debt'}</p>
                    {debt.type === 'revolving' && (
                        <p><strong>Debt Limit:</strong> P{debt.debtLimit.toLocaleString()}</p>
                    )}
                    {debt.type !== 'revolving' && (
                        <>
                            <p><strong>Original Loan Amount:</strong> P{debt.originalAmount.toLocaleString()}</p>
                            <p><strong>Loan Term:</strong> {debt.loanTerm} Months</p>
                            <p><strong>Start Date:</strong> {debt.startDate}</p>
                        </>
                    )}
                    <p><strong>Balance:</strong> P{debt.balance.toLocaleString()}</p>
                    <p><strong>Interest Rate:</strong> {debt.interestRate}%</p>
                    <p><strong>Minimum Payment:</strong> P{debt.minPayment.toLocaleString()}</p>
                    <button
                        onClick={() => setIsEditing(true)}
                        style={{
                            marginTop: '10px',
                            padding: '10px',
                            backgroundColor: '#2196f3',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '5px',
                            marginRight: '10px',
                        }}
                    >
                        Edit
                    </button>
                    <button
                        onClick={handleDeleteDebt}
                        style={{
                            marginTop: '10px',
                            padding: '10px',
                            backgroundColor: '#f44336',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '5px',
                        }}
                    >
                        Delete
                    </button>
                </>
            )}
            <Link to="/debt-management">
                <button
                    style={{
                        marginTop: '20px',
                        padding: '10px',
                        backgroundColor: '#4caf50',
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

export default DebtDetails;
