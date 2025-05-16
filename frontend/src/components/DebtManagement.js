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
                const response = await fetch('/api/debts'); // Fetch from the debts table in the backend
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

    // Debt reduction analysis helper
    function calculateAmortisationScenarios(debt, method = 'avalanche') {
        const scenarios = [];

        // Base scenario: current min payment
        scenarios.push({
            label: 'Base (Min Payment)',
            monthlyPayment: debt.min_payment,
        });

        // Scenario increases
        const increments = [0.1, 0.2, 0.5];

        if (method === 'avalanche') {
            increments.forEach(inc => {
                scenarios.push({
                    label: `Min + ${inc * 100}%`,
                    monthlyPayment: debt.min_payment * (1 + inc),
                });
            });
        } else if (method === 'snowball') {
            increments.forEach(inc => {
                scenarios.push({
                    label: `+${inc * 100}% of Balance`,
                    monthlyPayment: debt.min_payment + (debt.balance * inc),
                });
            });
        }

        const results = scenarios.map(({ label, monthlyPayment }) => {
            let balance = debt.balance;
            let totalInterest = 0;
            let months = 0;
            let lastPrincipalPayment = 0; // Track last principal payment

            const monthlyRate = debt.interest_rate / 12 / 100;

            while (balance > 0) {
                const interest = balance * monthlyRate;
                totalInterest += interest;
                let principalPayment = monthlyPayment - interest;
                lastPrincipalPayment = principalPayment; // Save for use after loop

                // Prevent infinite loop
                if (principalPayment <= 0) {
                    return {
                        scenario: label,
                        months: null,
                        days: null,
                        error: 'Payment too low to cover interest',
                    };
                }

                balance -= principalPayment;
                months++;
            }

            // Calculate days as: (payment - overpayment) / daily rate
            const overpayment = Math.abs(balance);
            let days = 0;
            if (months > 0 && lastPrincipalPayment > 0) {
                const dailyRate = monthlyPayment / 30.44;
                const paymentUsed = monthlyPayment - overpayment;
                days = Math.ceil(paymentUsed / dailyRate);
            }
            const displayMonths = months - 1;

            return {
                scenario: label,
                months: displayMonths,
                days: days,
                totalInterest: totalInterest.toFixed(2),
            };
        });

        return results;
    }

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
                        ? (balance / (debt.debt_limit || 1)) * 100 // Correct calculation for revolving debt
                        : ((debt.original_amount - balance) / (debt.original_amount || 1)) * 100 || 0;

                    const progressValue = debt.type === 'revolving'
                        ? (balance / (debt.debt_limit || 1)) * 100 // Correct progress bar for revolving debt
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
                                value={progressValue}
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
                            <strong>Highest Interest Rate Debt:</strong> {debts.length > 0 ? debts.reduce((prev, curr) => (parseFloat(prev.interest_rate) > parseFloat(curr.interest_rate) ? prev : curr)).name : 'N/A'}
                        </Typography>
                        {debts.length > 0 && (() => {
                            const highestInterestDebt = debts.reduce((prev, curr) => (parseFloat(prev.interest_rate) > parseFloat(curr.interest_rate) ? prev : curr));
                            const scenarios = calculateAmortisationScenarios(highestInterestDebt, 'avalanche');
                            const base = scenarios[0];
                            return (
                                <ul>
                                    {scenarios.map(({ scenario, months, days, totalInterest, error }, idx) => {
                                        let extraInfo = '';
                                        if (!error && idx > 0 && base.months !== null && base.days !== null) {
                                            // Calculate days difference
                                            const baseTotalDays = base.months * 30.44 + base.days;
                                            const scenarioTotalDays = months * 30.44 + days;
                                            const daysSaved = Math.round(baseTotalDays - scenarioTotalDays);

                                            // Calculate interest difference
                                            const interestSaved = (parseFloat(base.totalInterest) - parseFloat(totalInterest)).toFixed(2);

                                            extraInfo = ` Save yourself ${daysSaved} days and ${interestSaved} interest.`;
                                        }
                                        return (
                                            <li key={scenario}>
                                                <Typography variant="body2" color="textSecondary">
                                                    {scenario}: {error ? error : `Payoff in ${months} months and ${days} days, total interest: ${totalInterest}${extraInfo}`}
                                                </Typography>
                                            </li>
                                        );
                                    })}
                                </ul>
                            );
                        })()}
                    </li>
                    <li>
                        <Typography variant="body1" color="textPrimary">
                            <strong>Smallest Debt Balance:</strong> {debts.length > 0 ? debts.reduce((prev, curr) => (parseFloat(prev.balance) < parseFloat(curr.balance) ? prev : curr)).name : 'N/A'}
                        </Typography>
                        {debts.length > 0 && (() => {
                            const smallestDebt = debts.reduce((prev, curr) => (parseFloat(prev.balance) < parseFloat(curr.balance) ? prev : curr));
                            // Recalculate scenarios using the current balance for each scenario
                            const baseBalance = parseFloat(smallestDebt.balance);
                            const baseMinPayment = parseFloat(smallestDebt.min_payment);
                            const baseInterestRate = parseFloat(smallestDebt.interest_rate);

                            // Build scenarios using the correct balance for each scenario
                            const increments = [0, 0.1, 0.2, 0.5];
                            const scenarios = increments.map((inc, idx) => {
                                let label, monthlyPayment;
                                if (idx === 0) {
                                    label = 'Base (Min Payment)';
                                    monthlyPayment = baseMinPayment;
                                } else {
                                    label = `Min + ${inc * 100}% of Balance`;
                                    monthlyPayment = baseMinPayment + (baseBalance * inc);
                                }

                                let balance = baseBalance;
                                let totalInterest = 0;
                                let months = 0;
                                let lastPrincipalPayment = 0;

                                const monthlyRate = baseInterestRate / 12 / 100;

                                while (balance > 0) {
                                    const interest = balance * monthlyRate;
                                    totalInterest += interest;
                                    let principalPayment = monthlyPayment - interest;
                                    lastPrincipalPayment = principalPayment;

                                    if (principalPayment <= 0) {
                                        return {
                                            scenario: label,
                                            months: null,
                                            days: null,
                                            totalInterest: null,
                                            error: 'Payment too low to cover interest',
                                        };
                                    }

                                    balance -= principalPayment;
                                    months++;
                                }

                                const overpayment = Math.abs(balance);
                                let days = 0;
                                if (months > 0 && lastPrincipalPayment > 0) {
                                    const dailyRate = monthlyPayment / 30.44;
                                    const paymentUsed = monthlyPayment - overpayment;
                                    days = Math.ceil(paymentUsed / dailyRate);
                                }
                                const displayMonths = months - 1;

                                return {
                                    scenario: label,
                                    months: displayMonths,
                                    days: days,
                                    totalInterest: totalInterest.toFixed(2),
                                    error: null,
                                };
                            });

                            const base = scenarios[0];
                            return (
                                <ul>
                                    {scenarios.map(({ scenario, months, days, totalInterest, error }, idx) => {
                                        let extraInfo = '';
                                        if (!error && idx > 0 && base.months !== null && base.days !== null) {
                                            const baseTotalDays = base.months * 30.44 + base.days;
                                            const scenarioTotalDays = months * 30.44 + days;
                                            const daysSaved = Math.round(baseTotalDays - scenarioTotalDays);
                                            const interestSaved = (parseFloat(base.totalInterest) - parseFloat(totalInterest)).toFixed(2);
                                            extraInfo = ` Save yourself ${daysSaved} days and ${interestSaved} interest.`;
                                        }
                                        return (
                                            <li key={scenario}>
                                                <Typography variant="body2" color="textSecondary">
                                                    {scenario}: {error ? error : `Payoff in ${months} months and ${days} days, total interest: ${totalInterest}${extraInfo}`}
                                                </Typography>
                                            </li>
                                        );
                                    })}
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