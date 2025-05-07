import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Chart } from 'react-google-charts';

const BudgetManager = ({ transactions }) => {
    const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December',
    ];

    const [currentMonthIndex] = useState(new Date().getMonth()); // Focus on current month

    const filteredTransactions = transactions.filter(
        (transaction) => new Date(transaction.date).getMonth() === currentMonthIndex
    );

    const totalIncome = filteredTransactions
        .filter((transaction) => transaction.type === 'income')
        .reduce((sum, transaction) => sum + transaction.amount, 0);

    const totalExpenses = filteredTransactions
        .filter((transaction) => transaction.type === 'expense')
        .reduce((sum, transaction) => sum + transaction.amount, 0);

    const remainingBudget = totalIncome - totalExpenses;

    // Group expenses by category
    const expensesByCategory = filteredTransactions
        .filter((t) => t.type === 'expense')
        .reduce((acc, t) => {
            acc[t.category] = (acc[t.category] || 0) + t.amount;
            return acc;
        }, {});

    // Update % Paid for revolving debt
    const updatedTransactions = transactions.map((transaction) => {
        if (transaction.type === 'revolving') {
            const percentageUsed = (transaction.balance / transaction.debtLimit) * 100 || 0; // Current balance as a percentage of debt limit
            return { ...transaction, percentageUsed: percentageUsed.toFixed(2) };
        }
        return transaction;
    });

    // Prepare data for the pie chart
    const chartData = [
        ['Category', 'Amount'],
        ...Object.entries(expensesByCategory),
        ['Unspent Budget', Math.max(remainingBudget, 0)],
    ];

    const chartOptions = {
        title: '', // Remove the chart title
        titleTextStyle: {}, // Clear title styling
        pieHole: 0.4,
        is3D: false,
        pieSliceText: 'none', // Disable default slice text
        tooltip: {
            trigger: 'focus', // Show tooltips on hover
        },
        slices: {
            0: { color: '#74c0fc' }, // Example color for first category
            1: { color: '#ff6b6b' }, // Example color for second category
            2: { color: '#51cf66' }, // Example color for unspent budget
        },
        legend: 'none', // Hide the legend
        pieSliceTextStyle: {
            fontSize: 12,
        },
        chartArea: {
            width: '90%',
            height: '80%',
        },
        pieStartAngle: 0, // Start the pie chart at a consistent angle
    };

    // Custom formatter for labels
    const formattedChartData = chartData.map(([category, amount], index) => {
        if (index === 0) return chartData[0]; // Keep the header row unchanged
        const percentage = ((amount / totalIncome) * 100).toFixed(1);
        return [`${category}\n${percentage}%\nP${amount.toLocaleString()}`, amount];
    });

    const spentPercentage = ((totalExpenses / totalIncome) * 100).toFixed(1);
    const remainingPercentage = Math.max(((remainingBudget / totalIncome) * 100).toFixed(1), 0);
    const overspentAmount = Math.max(totalExpenses - totalIncome, 0);

    return (
        <div style={{ fontFamily: 'Open Sans, sans-serif', textAlign: 'center' }}>
            <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>Budget Manager</h2>
            <h3 style={{ textAlign: 'center', marginBottom: '20px' }}>{months[currentMonthIndex]}</h3>
            <div style={{ display: 'flex', justifyContent: 'space-around', marginBottom: '20px' }}>
                <div>
                    <h3>Total Income</h3>
                    <p style={{ fontSize: '24px', color: '#006400' }}>P{totalIncome.toLocaleString()}</p>
                </div>
                <div>
                    <h3>Total Expenses</h3>
                    <p style={{ fontSize: '24px', color: '#8B0000' }}>P{totalExpenses.toLocaleString()}</p>
                </div>
                <div>
                    <h3>Remaining Budget</h3>
                    <p style={{ fontSize: '24px', color: remainingBudget >= 0 ? '#006400' : '#8B0000' }}>
                        P{remainingBudget.toLocaleString()}
                    </p>
                </div>
            </div>
            <div
                style={{
                    position: 'relative',
                    height: '40px',
                    backgroundColor: '#d3d3d3',
                    borderRadius: '5px',
                    margin: '20px auto',
                    maxWidth: '600px',
                }}
            >
                {/* Green section for total income */}
                <div
                    style={{
                        position: 'absolute',
                        height: '100%',
                        width: `${Math.min((totalIncome / totalIncome) * 100, 100)}%`,
                        backgroundColor: '#006400',
                        borderRadius: '5px 0 0 5px',
                    }}
                ></div>

                {/* Red section for total expenses */}
                <div
                    style={{
                        position: 'absolute',
                        height: '100%',
                        width: `${Math.min((totalExpenses / totalIncome) * 100, 100)}%`,
                        backgroundColor: '#8B0000',
                        borderRadius: totalExpenses > totalIncome ? '0' : '0 5px 5px 0',
                    }}
                ></div>

                {/* Bright red section for overspent amount */}
                {totalExpenses > totalIncome && (
                    <div
                        style={{
                            position: 'absolute',
                            height: '100%',
                            left: '100%',
                            width: `${(overspentAmount / totalIncome) * 100}%`,
                            backgroundColor: '#D2042D', // Cherry red for overspent section
                            borderRadius: '0 5px 5px 0',
                        }}
                    ></div>
                )}

                {/* Data labels */}
                <div
                    style={{
                        position: 'absolute',
                        top: '50%',
                        left: '10px',
                        transform: 'translateY(-50%)',
                        color: '#fff',
                        fontWeight: 'bold',
                    }}
                >
                    Spent: P{totalExpenses.toLocaleString()} ({spentPercentage}%)
                </div>
                {remainingBudget >= 0 ? (
                    <div
                        style={{
                            position: 'absolute',
                            top: '50%',
                            right: '10px',
                            transform: 'translateY(-50%)',
                            color: '#fff',
                            fontWeight: 'bold',
                        }}
                    >
                        Left: P{remainingBudget.toLocaleString()} ({remainingPercentage}%)
                    </div>
                ) : (
                    <div
                        style={{
                            position: 'absolute',
                            top: '50%',
                            right: '-120px', // Move text outside the graph
                            transform: 'translateY(-50%)',
                            color: '#fff', // White text for overspent label
                            fontWeight: 'bold',
                            fontSize: '16px', // Same size as "Spent" text
                        }}
                    >
                        Overspent: P{overspentAmount.toLocaleString()}
                    </div>
                )}
            </div>
            <div style={{ marginBottom: '20px', textAlign: 'center' }}>
                <h3 style={{ fontSize: '30px', fontWeight: 'bold', textAlign: 'center' }}>Spending Breakdown</h3>
                <Chart
                    chartType="PieChart"
                    data={formattedChartData}
                    options={{
                        ...chartOptions,
                        pieSliceText: 'none',
                        pieSliceTextStyle: {
                            fontSize: 12,
                        },
                        tooltip: {
                            isHtml: true,
                        },
                    }}
                    width="100%"
                    height="400px"
                />
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <Link to="/">
                    <button>Back to Home</button>
                </Link>
                <Link to="/budget-details" state={{ transactions }}>
                    <button>View Details</button>
                </Link>
                <Link to="/add-transaction">
                    <button>Add New</button>
                </Link>
                <Link to="/yearly-budget">
                    <button>Yearly Budget</button>
                </Link>
                <Link to="/spending-targets">
                    <button>Set Spending Targets</button>
                </Link>
            </div>
        </div>
    );
};

export default BudgetManager;
