import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Chart } from 'react-google-charts';

const YearlyBudget = () => {
    const [transactions, setTransactions] = useState([]); // Initialize state for transactions
    const [yearlyTargets, setYearlyTargets] = useState({}); // Initialize state for yearly targets

    const [displayedDate, setDisplayedDate] = useState({
        year: new Date().getFullYear(),
        monthIndex: new Date().getMonth(),
    });

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

    // Fetch yearly targets from the backend
    useEffect(() => {
        const fetchYearlyTargets = async () => {
            try {
                const response = await fetch(`/api/yearlyTargets?year=${displayedDate.year}`); // Include year in the query parameter
                if (!response.ok) {
                    throw new Error('Failed to fetch yearly targets');
                }
                const data = await response.json();

                // Directly set the data as it is already in the expected structure
                setYearlyTargets(data);
            } catch (error) {
                console.error('Error fetching yearly targets:', error); // Debugging log for errors
            }
        };

        fetchYearlyTargets();
    }, [displayedDate.year]); // Refetch yearly targets when the displayed year changes

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
                acc[category] = { budget: 0, actual: 0 };
                return acc;
            }, {})
        )
    );

    const [currentMonthIndex, setCurrentMonthIndex] = useState(new Date().getMonth()); // Focus on current month
    const [currentYear, setCurrentYear] = useState(new Date().getFullYear()); // Add state for the current year

    const handlePreviousMonth = () => {
        setDisplayedDate(({ year, monthIndex }) => {
            if (monthIndex === 0) {
                // Move to December of the previous year
                return { year: year - 1, monthIndex: 11 };
            }
            return { year, monthIndex: monthIndex - 1 }; // Move to the previous month
        });
    };

    const handleNextMonth = () => {
        setDisplayedDate(({ year, monthIndex }) => {
            if (monthIndex === 11) {
                // Move to January of the next year
                return { year: year + 1, monthIndex: 0 };
            }
            return { year, monthIndex: monthIndex + 1 }; // Move to the next month
        });
    };

    useEffect(() => {
        const updatedData = categories.reduce((acc, category) => {
            // Fetch budget from yearlyTargets for the displayed year and month
            const yearData = yearlyTargets?.[displayedDate.year];
            const monthTargets = yearData ? yearData[displayedDate.monthIndex + 1] : null; // Adjust for 1-based months
            acc[category] = {
                budget: monthTargets?.[category] || 0, // Budget is fetched from yearlyTargets
                actual: 0, // Initialize actual to 0
            };
            return acc;
        }, {});

        // Calculate actual values from transactions
        transactions.forEach((transaction) => {
            const transactionDate = new Date(transaction.date); // Parse full date from transactions table
            const transactionMonth = transactionDate.getMonth(); // Extract month (0-based)
            const transactionYear = transactionDate.getFullYear(); // Extract year

            // Filter by displayed year and month
            if (transactionYear === displayedDate.year && transactionMonth === displayedDate.monthIndex) {
                const category = transaction.category || 'Other';
                if (updatedData[category]) {
                    updatedData[category].actual += parseFloat(transaction.amount); // Convert amount to number before summing
                }
            }
        });

        // Update monthly data for the displayed month
        const newMonthlyData = [...monthlyData];
        newMonthlyData[displayedDate.monthIndex] = updatedData;
        setMonthlyData(newMonthlyData);
    }, [transactions, yearlyTargets, displayedDate]); // Recalculate when transactions, yearlyTargets, or displayedDate changes

    // Prepare data for the column chart (Last 12 Months: Total Income vs. Total Spending)
    const columnChartData = [
        ['Month', 'Total Income', 'Total Spending'],
        ...Array.from({ length: 12 }, (_, i) => {
            const date = new Date();
            date.setMonth(currentMonthIndex - i); // Go back i months
            const monthIndex = date.getMonth();
            const year = date.getFullYear();
            const month = months[monthIndex];

            // Calculate total income for the month
            const totalIncome = transactions
                .filter((t) => t.type === 'income' && new Date(t.date).getMonth() === monthIndex && new Date(t.date).getFullYear() === year)
                .reduce((sum, t) => sum + parseFloat(t.amount), 0); // Ensure amount is treated as a number

            // Calculate total spending for the month
            const totalSpending = transactions
                .filter((t) => t.type === 'expense' && new Date(t.date).getMonth() === monthIndex && new Date(t.date).getFullYear() === year)
                .reduce((sum, t) => sum + parseFloat(t.amount), 0); // Ensure amount is treated as a number

            return [`${month} ${year}`, Number(totalIncome) || 0, Number(totalSpending) || 0]; // Ensure numbers are passed to the chart
        }).reverse(), // Reverse to show the most recent month last
    ];

    return (
        <div style={{ maxWidth: '1000px', margin: '0 auto', fontFamily: 'Open Sans, sans-serif' }}>
            <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>Yearly Budget</h2>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                <button onClick={handlePreviousMonth}>&lt; Previous</button>
                <h3>{months[displayedDate.monthIndex]} {displayedDate.year}</h3>
                <button onClick={handleNextMonth}>Next &gt;</button>
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
                        const monthData = monthlyData[displayedDate.monthIndex];
                        if (!monthData) return null;
                        const categoryData = monthData[category];
                        const difference = categoryData.budget - categoryData.actual; // Calculate difference
                        const maxValue = Math.max(categoryData.budget, categoryData.actual) || 1; // Avoid division by zero
                        return (
                            <tr key={category}>
                                <td style={{ padding: '8px', border: '1px solid #ccc', fontWeight: 'bold' }}>
                                    {category}
                                </td>
                                <td style={{ padding: '8px', border: '1px solid #ccc' }}>
                                    <div style={{ marginBottom: '10px', position: 'relative', height: '30px' }}>
                                        {/* Budget Bar */}
                                        <div
                                            style={{
                                                height: '100%',
                                                width: `${(categoryData.budget / maxValue) * 100}%`, // Budget bar width as % of max value
                                                backgroundColor: '#e0e0e0', // Light gray for budget
                                                borderRadius: '5px',
                                                position: 'absolute',
                                            }}
                                        ></div>
                                        {/* Actual Bar */}
                                        <div
                                            style={{
                                                height: '50%', // Smaller height for actual bar
                                                width: `${(categoryData.actual / maxValue) * 100}%`, // Actual bar width as % of max value
                                                backgroundColor: categoryData.actual > categoryData.budget ? '#f44336' : '#4caf50', // Red if over budget, green if within budget
                                                borderRadius: '5px',
                                                position: 'absolute',
                                                bottom: '25%', // Center the actual bar vertically
                                            }}
                                        ></div>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '5px' }}>
                                        <span>
                                            <strong>Budget:</strong> {categoryData.budget.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </span>
                                        <span>
                                            <strong>Actual:</strong> {categoryData.actual.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </span>
                                    </div>
                                    <div
                                        style={{
                                            textAlign: 'center',
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
                        vAxis: { title: 'Amount (P)', minValue: 0 }, // Ensure the vertical axis starts at 0
                        legend: { position: 'top' },
                        colors: ['#4caf50', '#f44336'], // Green for income, red for spending
                    }}
                    width="100%" // Correctly place the width attribute
                    height="400px" // Correctly place the height attribute
                />
            </div>
            <Link to="/budget-manager">
                <button>Back to Budget Manager</button>
            </Link>
        </div>
    );
};

export default YearlyBudget;
