import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Chart } from 'react-google-charts';
import axios from 'axios';

const BudgetManager = () => {
    const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December',
    ];

    const [currentMonthIndex, setCurrentMonthIndex] = useState(new Date().getMonth());
    const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
    const [totalIncome, setTotalIncome] = useState(0);
    const [totalExpenses, setTotalExpenses] = useState(0);
    const [expensesByClassification, setExpensesByClassification] = useState({}); // Changed from expensesByCategory

    useEffect(() => {
        const fetchBudgetData = async () => {
            try {
                const response = await axios.get('http://localhost:5000/api/transactions');
                const transactions = response.data;

                const filteredTransactions = transactions.filter((transaction) => {
                    const transactionDate = new Date(transaction.date);
                    return (
                        transactionDate.getMonth() === currentMonthIndex &&
                        transactionDate.getFullYear() === currentYear
                    );
                });

                const income = filteredTransactions
                    .filter((transaction) => transaction.type === 'income')
                    .reduce((sum, transaction) => sum + parseFloat(transaction.amount), 0);

                const expenses = filteredTransactions
                    .filter((transaction) => transaction.type === 'expense')
                    .reduce((sum, transaction) => sum + parseFloat(transaction.amount), 0);

                setTotalIncome(income);
                setTotalExpenses(expenses);

                // Group expenses by classification instead of category
                const groupedExpenses = filteredTransactions
                    .filter((transaction) => transaction.type === 'expense')
                    .reduce((acc, transaction) => {
                        const classification = transaction.classification || 'Unclassified';
                        acc[classification] = (acc[classification] || 0) + parseFloat(transaction.amount);
                        return acc;
                    }, {});

                setExpensesByClassification(groupedExpenses);
            } catch (error) {
                console.error('Error fetching transactions:', error);
            }
        };

        fetchBudgetData();
    }, [currentMonthIndex, currentYear]);

    const handlePrevious = () => {
        setCurrentMonthIndex((prev) => {
            if (prev === 0) {
                setCurrentYear((year) => year - 1); // Move to the previous year
                return 11; // Set month to December
            }
            return prev - 1;
        });
    };

    const handleNext = () => {
        setCurrentMonthIndex((prev) => {
            if (prev === 11) {
                setCurrentYear((year) => year + 1); // Move to the next year
                return 0; // Set month to January
            }
            return prev + 1;
        });
    };

    const remainingBudget = totalIncome - totalExpenses;

    // Updated chart data preparation
    const chartData = [
        ['Classification', 'Amount'],
        ['Essentials', expensesByClassification['Essentials'] || 0],
        ['Savings', expensesByClassification['Savings'] || 0],
        ['Non Essentials', expensesByClassification['Non Essentials'] || 0],
        ['Remaining Budget', Math.max(remainingBudget, 0)]
    ];

    const chartOptions = {
        title: 'Spending by Classification',
        pieHole: 0.4,
        is3D: false,
        legend: { position: 'right' },
        chartArea: { width: '70%', height: '80%' },
        colors: [
            '#FF9800', // Essentials (Orange)
            '#4CAF50', // Savings (Green)
            '#F44336', // Non Essentials (Red)
            '#E0E0E0', // Remaining Budget (Grey)
        ]
    };

    return (
        <div style={{ fontFamily: 'Open Sans, sans-serif', textAlign: 'center' }}>
            <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>Budget Manager</h2>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                <button onClick={handlePrevious}>
                    &lt; Previous Month
                </button>
                <h3>{`${months[currentMonthIndex]} ${currentYear}`}</h3>
                <button onClick={handleNext}>
                    Next Month &gt;
                </button>
            </div>
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
                            width: `${(totalExpenses - totalIncome) / totalIncome * 100}%`,
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
                    Spent: P{totalExpenses.toLocaleString()} ({((totalExpenses / totalIncome) * 100).toFixed(1)}%)
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
                        Left: P{remainingBudget.toLocaleString()} ({((remainingBudget / totalIncome) * 100).toFixed(1)}%)
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
                        Overspent: P{(totalExpenses - totalIncome).toLocaleString()}
                    </div>
                )}
            </div>
            <div style={{ marginBottom: '20px', textAlign: 'center' }}>
                <h3 style={{ fontSize: '30px', fontWeight: 'bold', textAlign: 'center' }}>Spending Breakdown</h3>
                <Chart
                    chartType="PieChart"
                    data={chartData}
                    options={chartOptions}
                    width="100%"
                    height="400px"
                />
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <Link to="/">
                    <button>Back to Home</button>
                </Link>
                <Link to="/budget-details">
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
