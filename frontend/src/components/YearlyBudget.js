import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Chart } from 'react-google-charts';

const YearlyBudget = () => {
    const [transactions, setTransactions] = useState([]); // Initialize state for transactions
    const [yearlyTargets, setYearlyTargets] = useState({}); // Initialize state for yearly targets

    useEffect(() => {
        // Fetch transactions from the backend
        const fetchTransactions = async () => {
            try {
                const response = await fetch('/api/transactions'); // Fetch transactions
                if (!response.ok) {
                    throw new Error('Failed to fetch transactions');
                }
                const data = await response.json();
                setTransactions(data); // Set transactions state
            } catch (error) {
                console.error('Error fetching transactions:', error);
            }
        };

        fetchTransactions();
    }, []); // Fetch data only once on component mount

    useEffect(() => {
        // Fetch yearly targets from the backend
        const fetchYearlyTargets = async () => {
            try {
                const response = await fetch('/api/yearlyTargets'); // Fetch yearly targets
                if (!response.ok) {
                    throw new Error('Failed to fetch yearly targets');
                }
                const data = await response.json();

                // Transform data into a structure matching { [year]: { [month]: { category: target } } }
                const transformedData = data.reduce((acc, row) => {
                    const { year, month, category, target } = row;
                    if (!acc[year]) acc[year] = {};
                    if (!acc[year][month]) acc[year][month] = {};
                    acc[year][month][category] = parseFloat(target); // Ensure target is treated as a number
                    return acc;
                }, {});
                setYearlyTargets(transformedData);
            } catch (error) {
                console.error('Error fetching yearly targets:', error); // Debugging log for errors
            }
        };

        fetchYearlyTargets();
    }, []); // Fetch data only once on component mount

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
    const [currentYear, setCurrentYear] = useState(new Date().getFullYear()); // Add state for the current year

    useEffect(() => {
        const updatedData = Array(12).fill(null).map((_, monthIndex) =>
            categories.reduce((acc, category) => {
                // Fetch target from yearlyTargets for the current year and month
                const yearData = yearlyTargets?.[currentYear];
                const monthTargets = yearData ? yearData[monthIndex + 1] : null; // Adjust for 1-based months
                acc[category] = {
                    target: monthTargets?.[category] || 0, // Target is fetched from yearlyTargets
                    actual: 0, // Initialize actual to 0
                };
                return acc;
            }, {})
        );

        // Calculate actual values from transactions
        transactions.forEach((transaction) => {
            const transactionDate = new Date(transaction.date); // Parse full date from transactions table
            const transactionMonth = transactionDate.getMonth(); // Extract month (0-based)
            const transactionYear = transactionDate.getFullYear(); // Extract year

            // Filter by year and month
            if (transactionYear === currentYear && transactionMonth >= 0 && transactionMonth < months.length) {
                const category = transaction.category || 'Other';
                if (updatedData[transactionMonth][category]) {
                    updatedData[transactionMonth][category].actual += parseFloat(transaction.amount); // Convert amount to number before summing
                }
            }
        });

        setMonthlyData(updatedData);
    }, [transactions, yearlyTargets, currentYear]); // Recalculate when transactions, yearlyTargets, or currentYear changes

    const handlePrevious = () => {
        setCurrentMonthIndex((prev) => {
            if (prev === 0) {
                setCurrentYear((year) => year - 1); // Move to the previous year
                return 11; // Set to December
            }
            return prev - 1;
        });
    };

    const handleNext = () => {
        setCurrentMonthIndex((prev) => {
            if (prev === 11) {
                setCurrentYear((year) => year + 1); // Move to the next year
                return 0; // Set to January
            }
            return prev + 1;
        });
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

    return (
        <div style={{ maxWidth: '1000px', margin: '0 auto', fontFamily: 'Open Sans, sans-serif' }}>
            <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>Yearly Budget</h2>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                <button onClick={handlePrevious}>&lt; Previous</button>
                <h3>{months[currentMonthIndex]} {currentYear}</h3>
                <button onClick={handleNext}>Next &gt;</button>
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
                                            <strong>Target:</strong> {categoryData.target.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </span>
                                        <span>
                                            <strong>Actual:</strong> {categoryData.actual.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </span>
                                    </div>
                                    <div
                                        style={{
                                            color: difference >= 0 ? 'green' : 'red', // Green if within budget, red if overbudget
                                            fontWeight: 'bold',
                                        }}
                                    >
                                        {difference >= 0
                                            ? `Within Budget By: ${difference.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                                            : `Overbudget By: ${Math.abs(difference).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
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
            <Link to="/budget-manager">
                <button>Back to Budget Manager</button>
            </Link>
        </div>
    );
};

export default YearlyBudget;
