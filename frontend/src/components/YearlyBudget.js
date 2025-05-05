import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Chart } from 'react-google-charts';

const YearlyBudget = ({ transactions, yearlyTargets }) => {
    const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December',
    ];

    const categories = [
        'Housing',
        'Utilities',
        'Groceries',
        'Transportation',
        'Dining Out',
        'Entertainment',
        'Shopping',
        'Health & Fitness',
        'Debt Payments',
        'Savings',
        'Insurance',
        'Other',
    ];

    const [monthlyData, setMonthlyData] = useState(
        Array(12).fill(null).map(() =>
            categories.reduce((acc, category) => {
                acc[category] = { target: 0, actual: 0 };
                return acc;
            }, {})
        )
    );

    const [currentMonthIndex, setCurrentMonthIndex] = useState(new Date().getMonth()); // Focus on current month
    const [selectedCategory, setSelectedCategory] = useState(categories[0]); // Default category for line chart

    useEffect(() => {
        // Initialize monthly data with targets from yearlyTargets
        const updatedData = Array(12).fill(null).map((_, monthIndex) =>
            categories.reduce((acc, category) => {
                acc[category] = {
                    target: yearlyTargets?.[monthIndex]?.[category] || 0, // Use yearlyTargets for targets
                    actual: 0,
                };
                return acc;
            }, {})
        );

        // Populate actual spending from transactions
        transactions.forEach((transaction) => {
            const transactionDate = new Date(transaction.date);
            const transactionMonth = transactionDate.getMonth();

            // Validate transactionMonth to ensure it's within bounds
            if (transactionMonth >= 0 && transactionMonth < months.length) {
                const category = transaction.category || 'Other';
                if (updatedData[transactionMonth][category]) {
                    updatedData[transactionMonth][category].actual += transaction.amount;
                }
            }
        });

        setMonthlyData(updatedData);
    }, [transactions, yearlyTargets]); // Recalculate when yearlyTargets or transactions change

    const handlePrevious = () => {
        setCurrentMonthIndex((prev) => Math.max(prev - 1, 0));
    };

    const handleNext = () => {
        setCurrentMonthIndex((prev) => Math.min(prev + 1, months.length - 1));
    };

    // Prepare data for the column chart (Total Income vs. Total Spending)
    const columnChartData = [
        ['Month', 'Total Income', 'Total Spending'],
        ...months.map((month, index) => {
            const totalIncome = transactions
                .filter((t) => t.type === 'income' && new Date(t.date).getMonth() === index)
                .reduce((sum, t) => sum + t.amount, 0);
            const totalSpending = transactions
                .filter((t) => t.type === 'expense' && new Date(t.date).getMonth() === index)
                .reduce((sum, t) => sum + t.amount, 0);
            return [month, totalIncome || null, totalSpending || null]; // Leave blank if no data
        }),
    ];

    // Prepare data for the line chart (Actual vs. Target for selected category)
    const lineChartData = [
        ['Month', 'Target', 'Actual'],
        ...months.map((month, index) => {
            const categoryData = monthlyData[index]?.[selectedCategory] || { target: 0, actual: 0 };
            return [month, categoryData.target, categoryData.actual];
        }),
    ];

    return (
        <div style={{ maxWidth: '1000px', margin: '0 auto', fontFamily: 'Open Sans, sans-serif' }}>
            <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>Yearly Budget</h2>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                <button onClick={handlePrevious} disabled={currentMonthIndex === 0}>
                    &lt; Previous
                </button>
                <h3>{months[currentMonthIndex]}</h3>
                <button onClick={handleNext} disabled={currentMonthIndex === months.length - 1}>
                    Next &gt;
                </button>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
                <thead>
                    <tr>
                        <th style={{ borderBottom: '2px solid #000', padding: '8px' }}>Category</th>
                        <th style={{ borderBottom: '2px solid #000', padding: '8px' }}>Details</th>
                    </tr>
                </thead>
                <tbody>
                    {categories.map((category) => {
                        const monthData = monthlyData[currentMonthIndex];
                        if (!monthData) return null;
                        const categoryData = monthData[category];
                        const difference = categoryData.target - categoryData.actual; // Calculate difference
                        const maxValue = Math.max(categoryData.target, categoryData.actual) || 1; // Avoid division by zero
                        return (
                            <tr key={category}>
                                <td style={{ padding: '8px', border: '1px solid #ccc', fontWeight: 'bold' }}>
                                    {category}
                                </td>
                                <td style={{ padding: '8px', border: '1px solid #ccc' }}>
                                    <div style={{ marginBottom: '10px', position: 'relative', height: '30px' }}>
                                        {/* Target Bar */}
                                        <div
                                            style={{
                                                height: '100%',
                                                width: `${(categoryData.target / maxValue) * 100}%`, // Target bar width as % of max value
                                                backgroundColor: '#e0e0e0', // Light gray for target
                                                borderRadius: '5px',
                                                position: 'absolute',
                                            }}
                                        ></div>
                                        {/* Actual Bar */}
                                        <div
                                            style={{
                                                height: '50%', // Smaller height for actual bar
                                                width: `${(categoryData.actual / maxValue) * 100}%`, // Actual bar width as % of max value
                                                backgroundColor: '#4caf50', // Green for actual
                                                borderRadius: '5px',
                                                position: 'absolute',
                                                bottom: '25%', // Center the actual bar vertically
                                            }}
                                        ></div>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '5px' }}>
                                        <span>
                                            <strong>Target:</strong> P{categoryData.target.toLocaleString()}
                                        </span>
                                        <span>
                                            <strong>Actual:</strong> P{categoryData.actual.toLocaleString()}
                                        </span>
                                    </div>
                                    <div
                                        style={{
                                            color: difference >= 0 ? 'green' : 'red', // Green if within budget, red if overbudget
                                            fontWeight: 'bold',
                                        }}
                                    >
                                        {difference >= 0
                                            ? `Within Budget By: P${difference.toLocaleString()}`
                                            : `Overbudget By: P${Math.abs(difference).toLocaleString()}`}
                                    </div>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
            <div style={{ marginBottom: '40px' }}>
                <h3 style={{ textAlign: 'center' }}>Total Income vs. Total Spending</h3>
                <Chart
                    chartType="ColumnChart"
                    data={columnChartData}
                    options={{
                        title: '',
                        hAxis: { title: 'Month' },
                        vAxis: { title: 'Amount (P)' },
                        legend: { position: 'top' },
                        colors: ['#4caf50', '#f44336'], // Green for income, red for spending
                    }}
                    width="100%"
                    height="400px"
                />
            </div>
            <div style={{ marginBottom: '40px' }}>
                <h3 style={{ textAlign: 'center' }}>Actual vs. Target for {selectedCategory}</h3>
                <div style={{ textAlign: 'center', marginBottom: '10px' }}>
                    <label htmlFor="category-select">Select Category:</label>
                    <select
                        id="category-select"
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        style={{ marginLeft: '10px' }}
                    >
                        {categories.map((category) => (
                            <option key={category} value={category}>
                                {category}
                            </option>
                        ))}
                    </select>
                </div>
                <Chart
                    chartType="LineChart"
                    data={lineChartData}
                    options={{
                        title: '',
                        hAxis: { title: 'Month' },
                        vAxis: { title: 'Amount (P)' },
                        legend: { position: 'top' },
                        colors: ['#2196f3', '#ff9800'], // Blue for target, orange for actual
                    }}
                    width="100%"
                    height="400px"
                />
            </div>
            <Link to="/budget-manager">
                <button>Back to Budget Manager</button>
            </Link>
        </div>
    );
};

export default YearlyBudget;
