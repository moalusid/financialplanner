import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Bar } from 'react-chartjs-2';
import { Chart, CategoryScale, LinearScale, BarElement, LineElement, PointElement, Tooltip, Legend } from 'chart.js';
import { Typography } from '@mui/material';
import { generateDebtInstallments } from '../utils/financialCalculations';
Chart.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Tooltip, Legend);

// If you see "Module not found: Error: Can't resolve 'react-chartjs-2'"
// You need to install the package in your project root (frontend folder):
// Run this command in your terminal:
//    npm install react-chartjs-2 chart.js

function calculateAmortisationSchedule(debt, monthlyPayment) {
    let balance = parseFloat(debt.balance);
    const monthlyRate = parseFloat(debt.interestRate || debt.interest_rate) / 12 / 100;
    let schedule = [];
    let month = 0;
    let totalInterest = 0;

    while (balance > 0 && month < 600) {
        const interest = balance * monthlyRate;
        let principalPayment = monthlyPayment - interest;
        if (principalPayment <= 0) break;
        let payment = Math.min(monthlyPayment, balance + interest);
        let principal = payment - interest;
        balance -= principal;
        totalInterest += interest;
        schedule.push({
            month: month + 1,
            payment: payment,
            principal: principal,
            interest: interest,
            balance: Math.max(balance, 0),
            totalInterest: totalInterest
        });
        month++;
    }
    return schedule;
}

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
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}-${month}-${year}`;
    };

    const formatDateForInput = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toISOString().split('T')[0];
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
                    originalAmount: data.original_amount,
                    loanTerm: data.loan_term,
                    startDate: formatDateForInput(data.start_date),
                    interestRate: data.interest_rate,
                    minPayment: data.min_payment,
                    debtLimit: data.debt_limit,
                    paymentDate: data.payment_date || '' // Add this line
                });
            } catch (error) {
                console.error('Error fetching debt:', error);
            }
        };

        fetchDebt();
    }, [id]);

    const handleSaveChanges = async () => {
        try {
            const updatedDebt = {
                ...debt,
                original_amount: debt.type === 'revolving' ? debt.debtLimit : debt.originalAmount,
                loan_term: debt.loanTerm,
                start_date: debt.startDate,
                interest_rate: debt.interestRate,
                min_payment: debt.minPayment,
                debt_limit: debt.debtLimit,
                payment_date: debt.paymentDate ? parseInt(debt.paymentDate) : null
            };

            const response = await fetch(`/api/debts/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(updatedDebt),
            });

            if (!response.ok) {
                throw new Error('Failed to update debt');
            }

            // If payment date is set, create planned expenses
            if (debt.paymentDate) {
                const installments = generateDebtInstallments({
                    ...updatedDebt,
                    id: id,
                    name: debt.name,
                    balance: debt.balance
                });

                // Create planned expenses for each installment
                for (const installment of installments) {
                    await fetch('http://localhost:5000/api/planned-expenses', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(installment),
                    });
                }
            }

            setIsEditing(false);
            alert('Debt and planned payments updated successfully!');
        } catch (error) {
            console.error('Error updating debt:', error);
            alert('An error occurred while updating.');
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

    const originalAmount = debt.originalAmount || 0;
    const amountPaid = debt.type === 'revolving'
        ? debt.debtLimit - debt.balance
        : originalAmount - debt.balance;

    const percentagePaid = debt.type === 'revolving'
        ? (1 - (debt.balance / debt.debtLimit)) * 100
        : (amountPaid / originalAmount) * 100;

    const schedule = calculateAmortisationSchedule(debt, debt.minPayment || debt.min_payment || 0);

    // Prepare data for bar/line chart: show actual payment, interest, principal, and balance
    const paymentData = [];
    const interestPortion = [];
    const principalPortion = [];
    const balanceData = [];
    const labels = [];

    // Get current date for month labels
    const now = new Date();
    schedule.forEach((row, idx) => {
        paymentData.push(row.payment);
        interestPortion.push(row.interest);
        principalPortion.push(row.principal);
        balanceData.push(row.balance);

        // Calculate label as calendar month
        const labelDate = new Date(now.getFullYear(), now.getMonth() + idx, 1);
        const monthLabel = labelDate.toLocaleString('default', { month: 'short', year: 'numeric' });
        labels.push(monthLabel);
    });

    const chartData = {
        labels,
        datasets: [
            {
                type: 'line',
                label: 'Balance',
                data: balanceData,
                borderColor: '#1976d2',
                backgroundColor: 'rgba(25, 118, 210, 0.1)',
                yAxisID: 'y',
                tension: 0.2,
                pointRadius: 0,
                order: 1,
            },
            {
                type: 'bar',
                label: 'Principal Portion',
                data: principalPortion,
                backgroundColor: 'rgba(76, 175, 80, 0.7)',
                yAxisID: 'y1',
                stack: 'Stack 0',
                order: 2,
            },
            {
                type: 'bar',
                label: 'Interest Portion',
                data: interestPortion,
                backgroundColor: 'rgba(244, 67, 54, 0.7)',
                yAxisID: 'y1',
                stack: 'Stack 0',
                order: 2,
            },
            {
                type: 'bar',
                label: 'Monthly Payment',
                data: paymentData,
                backgroundColor: 'rgba(33, 150, 243, 0.3)',
                yAxisID: 'y1',
                stack: 'Stack 1',
                order: 0,
                borderWidth: 0,
                barPercentage: 1.0,
                categoryPercentage: 1.0,
            }
        ]
    };

    const chartOptions = {
        responsive: true,
        plugins: {
            legend: { position: 'top' },
            tooltip: { mode: 'index', intersect: false }
        },
        scales: {
            y: {
                type: 'linear',
                display: true,
                position: 'left',
                title: { display: true, text: 'Balance (BWP)' },
                stacked: false,
            },
            y1: {
                type: 'linear',
                display: true,
                position: 'right',
                title: { display: true, text: 'Payment Breakdown (BWP)' },
                stacked: true,
                grid: { drawOnChartArea: false },
            },
            x: {
                stacked: true,
                title: { display: true, text: 'Month' }
            }
        }
    };

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
                                    value={formatDateForInput(debt.startDate)}
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
                    <label>
                        <strong>Payment Date (1-31):</strong>
                        <div style={{ color: '#666', fontSize: '0.9em', marginBottom: '5px' }}>
                            Current: {debt.payment_date ? `${debt.payment_date}${getDaySuffix(debt.payment_date)}` : 'Not set'}
                        </div>
                        <input
                            type="number"
                            value={debt.paymentDate}
                            onChange={(e) => setDebt({ 
                                ...debt, 
                                paymentDate: e.target.value ? Math.min(31, Math.max(1, parseInt(e.target.value))) : ''
                            })}
                            min="1"
                            max="31"
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
                    {debt.type === 'Fixed' && (
                        <>
                            <p><strong>Original Loan Amount:</strong> {formatCurrency(debt.originalAmount)}</p>
                            <p><strong>Loan Term:</strong> {debt.loanTerm} Months</p>
                            <p><strong>Start Date:</strong> {formatDate(debt.startDate)}</p>
                            <p><strong>Balance:</strong> {formatCurrency(debt.balance)}</p>
                            <p><strong>Interest Rate:</strong> {debt.interestRate}%</p>
                            <p><strong>Minimum Payment:</strong> {formatCurrency(debt.minPayment)}</p>
                            <p><strong>Payment Date:</strong> {debt.payment_date ? `${debt.payment_date}${getDaySuffix(debt.payment_date)} of each month` : 'Not set'}</p>
                        </>
                    )}
                    {debt.type === 'Revolving' && (
                        <>
                            <p><strong>Debt Limit:</strong> {formatCurrency(debt.debtLimit)}</p>
                            <p><strong>Balance:</strong> {formatCurrency(debt.balance)}</p>
                            <p><strong>Interest Rate:</strong> {debt.interestRate}%</p>
                            <p><strong>Minimum Payment:</strong> {formatCurrency(debt.minPayment)}</p>
                            <p><strong>Payment Date:</strong> {debt.payment_date ? `${debt.payment_date}${getDaySuffix(debt.payment_date)} of each month` : 'Not set'}</p>
                        </>
                    )}
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
            <div style={{ margin: '30px 0' }}>
                <Typography variant="h6" color="textPrimary" style={{ marginBottom: '10px' }}>
                    Amortisation Payment & Balance Chart
                </Typography>
                <Bar data={chartData} options={chartOptions} />
            </div>
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

// Add helper function for day suffixes
const getDaySuffix = (day) => {
    if (day >= 11 && day <= 13) return 'th';
    switch (day % 10) {
        case 1: return 'st';
        case 2: return 'nd';
        case 3: return 'rd';
        default: return 'th';
    }
};

export default DebtDetails;
