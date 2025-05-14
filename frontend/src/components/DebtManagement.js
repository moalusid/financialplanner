import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Typography, Card, CardContent, LinearProgress } from '@mui/material';

const DebtManagement = () => {
    const [debts, setDebts] = useState([]);
    const [totalOutstandingDebt, setTotalOutstandingDebt] = useState(0);
    const [totalMonthlyPayments, setTotalMonthlyPayments] = useState(0);
    const [averageInterestRate, setAverageInterestRate] = useState(0);
    const navigate = useNavigate();

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-BW', {
            style: 'currency',
            currency: 'BWP',
        }).format(amount);
    };

    useEffect(() => {
        const fetchDebts = async () => {
            try {
                const response = await fetch('/api/debts');
                if (!response.ok) {
                    throw new Error('Failed to fetch debts');
                }
                const data = await response.json();
                setDebts(data);

                // Calculate summary values
                const totalDebt = data.reduce((sum, debt) => sum + (parseFloat(debt.balance) || 0), 0);
                const totalPayments = data.reduce((sum, debt) => sum + (parseFloat(debt.min_payment) || 0), 0);
                const avgInterestRate =
                    data.length > 0
                        ? data.reduce((sum, debt) => sum + (parseFloat(debt.interest_rate) || 0), 0) / data.length
                        : 0;

                setTotalOutstandingDebt(totalDebt);
                setTotalMonthlyPayments(totalPayments);
                setAverageInterestRate(avgInterestRate);
            } catch (error) {
                console.error('Error fetching debts:', error);
            }
        };

        fetchDebts();
    }, []);

    const handleTileClick = (debtId) => {
        navigate(`/debt-details/${debtId}`);
    };

    return (
        <div style={{ maxWidth: '1000px', margin: '0 auto', fontFamily: 'Open Sans, sans-serif' }}>
            <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>Debt Management</h2>
            {/* Summary Cards */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', gap: '20px' }}>
                <Card style={{ flex: 1, textAlign: 'center', padding: '10px' }}>
                    <CardContent>
                        <Typography variant="h6" color="textSecondary">
                            Total Outstanding Debt
                        </Typography>
                        <Typography variant="h5" color="textPrimary">
                            {formatCurrency(totalOutstandingDebt)}
                        </Typography>
                    </CardContent>
                </Card>
                <Card style={{ flex: 1, textAlign: 'center', padding: '10px' }}>
                    <CardContent>
                        <Typography variant="h6" color="textSecondary">
                            Total Monthly Payments
                        </Typography>
                        <Typography variant="h5" color="textPrimary">
                            {formatCurrency(totalMonthlyPayments)}
                        </Typography>
                    </CardContent>
                </Card>
                <Card style={{ flex: 1, textAlign: 'center', padding: '10px' }}>
                    <CardContent>
                        <Typography variant="h6" color="textSecondary">
                            Average Interest Rate
                        </Typography>
                        <Typography variant="h5" color="textPrimary">
                            {averageInterestRate.toFixed(2)}%
                        </Typography>
                    </CardContent>
                </Card>
            </div>
            <Link to="/add-debt-type">
                <button style={{ marginBottom: '20px', padding: '10px', backgroundColor: '#4caf50', color: '#fff', border: 'none', borderRadius: '5px' }}>
                    Add New Debt
                </button>
            </Link>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
                {debts.map((debt) => {
                    const balance = parseFloat(debt.balance) || 0; // Ensure balance is a number
                    const minPayment = parseFloat(debt.min_payment) || 0; // Ensure min_payment is a number
                    const interestRate = parseFloat(debt.interest_rate) || 0; // Ensure interestRate is a number

                    const percentageUsed = debt.type === 'revolving'
                        ? (balance / (debt.debt_limit || 1)) * 100 // Avoid division by zero
                        : ((debt.original_amount - balance) / (debt.original_amount || 1)) * 100 || 0;

                    return (
                        <div
                            key={debt.id}
                            onClick={() => handleTileClick(debt.id)}
                            style={{
                                border: '1px solid #ccc',
                                borderRadius: '10px',
                                padding: '20px',
                                boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
                                textAlign: 'center',
                                cursor: 'pointer',
                            }}
                        >
                            <h3 style={{ marginBottom: '20px' }}>{debt.name || 'Unnamed Debt'}</h3>
                            <Typography variant="h6" component="div" color="textPrimary" style={{ marginBottom: '10px' }}>
                                Current Balance: {formatCurrency(balance)}
                            </Typography>
                            <LinearProgress
                                variant="determinate"
                                value={percentageUsed}
                                style={{ height: '20px', borderRadius: '10px', marginBottom: '10px' }}
                            />
                            <Typography variant="body2" component="div" color="textSecondary">
                                {percentageUsed.toFixed(2)}% Used
                            </Typography>
                            <Typography
                                variant="h5"
                                component="div"
                                color="textPrimary"
                                sx={{ fontWeight: 'bold', marginTop: '10px' }}
                            >
                                {interestRate.toFixed(2)}%
                            </Typography>
                            <Typography
                                variant="body2"
                                component="div"
                                sx={{ color: 'red', marginTop: '5px' }}
                            >
                                Monthly Payment: {formatCurrency(minPayment)}
                            </Typography>
                        </div>
                    );
                })}
            </div>
            {/* Debt Analysis Section */}
            <div style={{ marginTop: '40px', padding: '20px', border: '1px solid #ccc', borderRadius: '10px', backgroundColor: '#f9f9f9' }}>
                <Typography variant="h5" color="textPrimary" style={{ marginBottom: '20px', textAlign: 'center' }}>
                    Debt Reduction Analysis
                </Typography>
                <Typography variant="body1" color="textSecondary" style={{ marginBottom: '10px' }}>
                    To reduce your debt effectively, consider the following strategies:
                </Typography>
                <ul>
                    <li>
                        <Typography variant="body1" color="textPrimary">
                            <strong>Avalanche Method:</strong> Focus on paying off debts with the highest interest rates first while making minimum payments on others. This minimizes the total interest paid over time.
                        </Typography>
                    </li>
                    <li>
                        <Typography variant="body1" color="textPrimary">
                            <strong>Snowball Method:</strong> Focus on paying off the smallest debts first to build momentum and motivation, while making minimum payments on larger debts.
                        </Typography>
                    </li>
                </ul>
                <Typography variant="body1" color="textSecondary" style={{ marginTop: '20px' }}>
                    Based on your current debts:
                </Typography>
                <ul>
                    <li>
                        <Typography variant="body1" color="textPrimary">
                            <strong>Highest Interest Rate Debt:</strong> {debts.length > 0 ? debts.reduce((prev, curr) => (prev.interestRate > curr.interestRate ? prev : curr)).name : 'N/A'}
                        </Typography>
                        {debts.length > 0 && (() => {
                            const highestInterestDebt = debts.reduce((prev, curr) => (prev.interestRate > curr.interestRate ? prev : curr));
                            const scenarios = [0.1, 0.2, 0.5].map(extra => {
                                const extraPayment = highestInterestDebt.minPayment * extra;
                                const totalPayment = highestInterestDebt.minPayment + extraPayment;
                                const monthsSaved = Math.ceil(highestInterestDebt.balance / totalPayment) - Math.ceil(highestInterestDebt.balance / highestInterestDebt.minPayment);
                                const interestSaved = monthsSaved * (highestInterestDebt.balance * (highestInterestDebt.interestRate / 100) / 12);
                                return { extra: extra * 100, monthsSaved, interestSaved };
                            });
                            return (
                                <ul>
                                    {scenarios.map(({ extra, monthsSaved, interestSaved }) => (
                                        <li key={extra}>
                                            <Typography variant="body2" color="textSecondary">
                                                Paying {extra}% extra: Save {monthsSaved} months and {interestSaved.toFixed(2)} in interest.
                                            </Typography>
                                        </li>
                                    ))}
                                </ul>
                            );
                        })()}
                    </li>
                    <li>
                        <Typography variant="body1" color="textPrimary">
                            <strong>Smallest Debt Balance:</strong> {debts.length > 0 ? debts.reduce((prev, curr) => (prev.balance < curr.balance ? prev : curr)).name : 'N/A'}
                        </Typography>
                        {debts.length > 0 && (() => {
                            const smallestDebt = debts.reduce((prev, curr) => (prev.balance < curr.balance ? prev : curr));
                            const scenarios = [0.1, 0.2, .5].map(extra => {
                                const extraPayment = smallestDebt.balance * extra;
                                const totalPayment = smallestDebt.balance + extraPayment;
                                const monthsSaved = Math.ceil(smallestDebt.balance / smallestDebt.minPayment) - Math.ceil(totalPayment / smallestDebt.minPayment);
                                const interestSaved = monthsSaved * (smallestDebt.balance * (smallestDebt.interestRate / 100) / 12);
                                return { extra: extra * 100, monthsSaved, interestSaved };
                            });
                            return (
                                <ul>
                                    {scenarios.map(({ extra, monthsSaved, interestSaved }) => (
                                        <li key={extra}>
                                            <Typography variant="body2" color="textSecondary">
                                                Paying {extra}% of balance extra: Save {monthsSaved} months and {interestSaved.toFixed(2)} in interest.
                                            </Typography>
                                        </li>
                                    ))}
                                </ul>
                            );
                        })()}
                    </li>
                </ul>
                <Typography variant="body1" color="textSecondary" style={{ marginTop: '20px' }}>
                    Choose a method that aligns with your financial goals and discipline. Remember to revisit your budget regularly to allocate extra funds toward debt repayment.
                </Typography>
            </div>
        </div>
    );
};

export default DebtManagement;