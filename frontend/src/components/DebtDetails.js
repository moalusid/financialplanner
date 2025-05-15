import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';

const DebtDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [debt, setDebt] = useState(null);
    const [isEditing, setIsEditing] = useState(false);

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-BW', {
            style: 'currency',
            currency: 'BWP',
        }).format(amount);
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-based
        const year = date.getFullYear();
        return `${day}-${month}-${year}`;
    };

    useEffect(() => {
        const fetchDebt = async () => {
            try {
                const response = await fetch(`/api/debts/${id}`);
                if (!response.ok) {
                    throw new Error('Failed to fetch debt');
                }
                const data = await response.json();
                setDebt({
                    ...data,
                    originalAmount: data.original_amount, // Map original_amount to originalAmount
                    loanTerm: data.loan_term, // Map loan_term to loanTerm
                    startDate: data.start_date, // Map start_date to startDate
                    interestRate: data.interest_rate, // Map interest_rate to interestRate
                    minPayment: data.min_payment, // Map min_payment to minPayment
                });
            } catch (error) {
                console.error('Error fetching debt:', error);
            }
        };

        fetchDebt();
    }, [id]);

    const handleSaveChanges = async () => {
        try {
            const response = await fetch(`/api/debts/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ...debt,
                    original_amount: debt.originalAmount, // Map originalAmount to original_amount
                    loan_term: debt.loanTerm, // Map loanTerm to loan_term
                    start_date: debt.startDate, // Map startDate to start_date
                    interest_rate: debt.interestRate, // Map interestRate to interest_rate
                    min_payment: debt.minPayment, // Map minPayment to min_payment
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to update debt');
            }

            setIsEditing(false);
            alert('Debt updated successfully!');
        } catch (error) {
            console.error('Error updating debt:', error);
            alert('An error occurred while updating the debt.');
        }
    };

    const handleDeleteDebt = async () => {
        try {
            const response = await fetch(`/api/debts/${id}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                throw new Error('Failed to delete debt');
            }

            alert('Debt deleted successfully!');
            navigate('/debt-management');
        } catch (error) {
            console.error('Error deleting debt:', error);
            alert('An error occurred while deleting the debt.');
        }
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
                        <p><strong>Debt Limit:</strong> {formatCurrency(debt.debtLimit)}</p>
                    )}
                    {debt.type !== 'revolving' && (
                        <>
                            <p><strong>Original Loan Amount:</strong> {formatCurrency(debt.originalAmount)}</p>
                            <p><strong>Loan Term:</strong> {debt.loanTerm} Months</p>
                            <p><strong>Start Date:</strong> {formatDate(debt.startDate)}</p>
                        </>
                    )}
                    <p><strong>Balance:</strong> {formatCurrency(debt.balance)}</p>
                    <p><strong>Interest Rate:</strong> {debt.interestRate}%</p>
                    <p><strong>Minimum Payment:</strong> {formatCurrency(debt.minPayment)}</p>
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
