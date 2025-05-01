import React from 'react';
import { Link } from 'react-router-dom';
import { Chart } from 'react-google-charts';

const BudgetManager = ({ transactions }) => {
    const totalIncome = transactions
        .filter((t) => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
    const totalExpenses = transactions
        .filter((t) => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);
    const remainingBudget = totalIncome - totalExpenses;

    // Group expenses by category
    const expensesByCategory = transactions
        .filter((t) => t.type === 'expense')
        .reduce((acc, t) => {
            acc[t.category] = (acc[t.category] || 0) + t.amount;
            return acc;
        }, {});

    // Prepare data for the pie chart
    const chartData = [
        ['Category', 'Amount'],
        ...Object.entries(expensesByCategory),
        ['Unspent Budget', Math.max(remainingBudget, 0)],
    ];

    const chartOptions = {
        title: 'Spending Breakdown',
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

    return (
        <div style={{ fontFamily: 'Open Sans, sans-serif' }}>
            <h2>Budget Manager</h2>
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                <div style={{ marginBottom: '10px' }}>
                    <h3>Total Income</h3>
                    <p style={{ fontSize: '24px', color: '#006400' }}>P{totalIncome.toLocaleString()}</p>
                </div>
                <div style={{ marginBottom: '10px' }}>
                    <h3>Total Expenses</h3>
                    <p style={{ fontSize: '24px', color: '#8B0000' }}>P{totalExpenses.toLocaleString()}</p>
                </div>
                <div style={{ marginBottom: '20px' }}>
                    <h3>Remaining Budget</h3>
                    <p style={{ fontSize: '24px', color: remainingBudget >= 0 ? '#006400' : '#8B0000' }}>
                        P{remainingBudget.toLocaleString()}
                    </p>
                </div>
                <div style={{ position: 'relative', height: '30px', backgroundColor: '#d3d3d3', borderRadius: '5px' }}>
                    <div
                        style={{
                            position: 'absolute',
                            height: '100%',
                            width: `${(totalIncome > 0 ? (totalIncome / totalIncome) * 100 : 0)}%`,
                            backgroundColor: '#006400',
                            borderRadius: '5px',
                        }}
                    ></div>
                    <div
                        style={{
                            position: 'absolute',
                            height: '100%',
                            width: `${(totalExpenses / totalIncome) * 100}%`,
                            backgroundColor: '#8B0000',
                            borderRadius: '5px',
                        }}
                    ></div>
                </div>
            </div>
            <div style={{ marginBottom: '20px' }}>
                <Chart
                    chartType="PieChart"
                    data={formattedChartData}
                    options={{
                        ...chartOptions,
                        pieSliceText: 'none', // Disable default slice text
                        pieSliceTextStyle: {
                            fontSize: 12,
                        },
                        tooltip: {
                            isHtml: true, // Enable rich tooltips
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
            </div>
        </div>
    );
};

export default BudgetManager;
