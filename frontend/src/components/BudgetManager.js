import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PieChart, Pie, Cell, Legend, ResponsiveContainer, Tooltip } from 'recharts';
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
    const [plannedExpenses, setPlannedExpenses] = useState([]);
    const [upcomingExpenses, setUpcomingExpenses] = useState(0);

    useEffect(() => {
        const fetchBudgetData = async () => {
            try {
                // Fetch transactions
                const transactionsResponse = await axios.get('http://localhost:5000/api/transactions');
                const transactions = transactionsResponse.data;

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

                // Fetch planned expenses for current and next month
                const plannedResponse = await axios.get('http://localhost:5000/api/planned-expenses');
                const currentDate = new Date(currentYear, currentMonthIndex);
                const nextDate = new Date(currentYear, currentMonthIndex + 1);
                
                const upcomingExpenses = plannedResponse.data.filter(expense => {
                    const expenseDate = new Date(expense.due_date);
                    return expense.status === 'pending' && 
                           expenseDate >= currentDate && 
                           expenseDate <= new Date(nextDate.getFullYear(), nextDate.getMonth() + 1, 0);
                }).sort((a, b) => new Date(a.due_date) - new Date(b.due_date));

                setPlannedExpenses(upcomingExpenses);
                setUpcomingExpenses(upcomingExpenses.reduce((sum, expense) => 
                    sum + parseFloat(expense.amount), 0
                ));
            } catch (error) {
                console.error('Error fetching data:', error);
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

    // Update chart data preparation
    const maxAmount = Math.max(totalIncome, totalExpenses);
    const totalInnerValue = Object.values(expensesByClassification).reduce((sum, val) => sum + val, 0) + Math.max(remainingBudget, 0);

    const innerData = [
        { 
            name: 'Essentials', 
            value: expensesByClassification['Essentials'] || 0,
            percentage: ((expensesByClassification['Essentials'] || 0) / totalExpenses * 100).toFixed(1)
        },
        { 
            name: 'Savings', 
            value: expensesByClassification['Savings'] || 0,
            percentage: ((expensesByClassification['Savings'] || 0) / totalExpenses * 100).toFixed(1)
        },
        { 
            name: 'Non Essentials', 
            value: expensesByClassification['Non Essentials'] || 0,
            percentage: ((expensesByClassification['Non Essentials'] || 0) / totalExpenses * 100).toFixed(1)
        },
        { 
            name: 'Hidden', 
            value: Math.max(0, maxAmount - totalExpenses),
            hide: true 
        }
    ];

    const outerData = [
        { 
            name: 'Total Income', 
            value: totalIncome 
        },
        { 
            name: 'Hidden', 
            value: Math.max(0, maxAmount - totalIncome),
            hide: true 
        }
    ];

    const COLORS = {
        inner: ['#FF9800', '#4CAF50', '#F44336'],
        outer: ['#2196F3']
    };

    // Add new function to get bar color based on classification
    const getBarColor = (classification) => {
        switch (classification) {
            case 'Essentials': return '#FF9800';
            case 'Non Essentials': return '#F44336';
            case 'Savings': return '#4CAF50';
            default: return '#757575';
        }
    };

    // Add this function after getBarColor
    const getBarWidth = (amount) => {
        const maxAmount = Math.max(...plannedExpenses.map(e => parseFloat(e.amount)));
        return `${(parseFloat(amount) / maxAmount) * 100}%`;
    };

    // Replace Chart component with this
    const renderDonutChart = () => (
        <ResponsiveContainer width="100%" height={400}>
            <PieChart>
                <Pie
                    data={outerData}
                    dataKey="value"
                    cx="50%"
                    cy="50%"
                    outerRadius={150}
                    innerRadius={130}
                    startAngle={0}
                    endAngle={360}
                >
                    {outerData.map((entry, index) => (
                        <Cell 
                            key={`outer-${index}`} 
                            fill={entry.hide ? 'transparent' : COLORS.outer[0]}
                        />
                    ))}
                </Pie>
                <Pie
                    data={innerData}
                    dataKey="value"
                    cx="50%"
                    cy="50%"
                    innerRadius={80}
                    outerRadius={120}
                    startAngle={0}
                    endAngle={360}
                >
                    {innerData.map((entry, index) => (
                        <Cell 
                            key={`inner-${index}`} 
                            fill={entry.hide ? 'transparent' : COLORS.inner[index]}
                        />
                    ))}
                </Pie>
                <Tooltip 
                    formatter={(value, name, entry) => {
                        if (name === 'Hidden') return null;
                        if (name === 'Total Income') return [`P${value.toLocaleString('en-BW')}`];
                        return [`P${value.toLocaleString('en-BW')} (${entry.payload.percentage}%)`];
                    }}
                    contentStyle={{ 
                        display: (_, payload) => 
                            payload[0]?.name === 'Hidden' ? 'none' : 'block' 
                    }}
                />
                <Legend 
                    payload={[...innerData, ...outerData]
                        .filter(item => !item.hide)
                        .map((entry, index) => ({
                            value: `${entry.name}${entry.percentage ? ` (${entry.percentage}%)` : ''}`,
                            type: 'circle',
                            color: entry.name === 'Total Income' ? COLORS.outer[0] : COLORS.inner[index]
                        }))}
                />
            </PieChart>
        </ResponsiveContainer>
    );

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
                    <p style={{ fontSize: '24px', color: '#006400' }}>P{totalIncome.toLocaleString('en-BW')}</p>
                </div>
                <div>
                    <h3>Total Expenses</h3>
                    <p style={{ fontSize: '24px', color: '#8B0000' }}>P{totalExpenses.toLocaleString('en-BW')}</p>
                </div>
                <div>
                    <h3>Remaining Budget</h3>
                    <p style={{ fontSize: '24px', color: remainingBudget >= 0 ? '#006400' : '#8B0000' }}>
                        P{remainingBudget.toLocaleString('en-BW')}
                    </p>
                </div>
                <div>
                    <h3>Planned Expenses</h3>
                    <p style={{ fontSize: '24px', color: '#FF9800' }}>
                        P{upcomingExpenses.toLocaleString('en-BW')}
                    </p>
                    <small>({plannedExpenses.length} upcoming)</small>
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
                    Spent: P{totalExpenses.toLocaleString('en-BW')} ({((totalExpenses / totalIncome) * 100).toFixed(1)}%)
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
                        Left: P{remainingBudget.toLocaleString('en-BW')} ({((remainingBudget / totalIncome) * 100).toFixed(1)}%)
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
                        Overspent: P{(totalExpenses - totalIncome).toLocaleString('en-BW')}
                    </div>
                )}
            </div>
            <div style={{ marginBottom: '20px', textAlign: 'center' }}>
                <h3 style={{ fontSize: '30px', fontWeight: 'bold', textAlign: 'center' }}>Spending Breakdown</h3>
                {renderDonutChart()}
            </div>
            <div style={{ marginBottom: '20px', textAlign: 'center' }}>
                <h3 style={{ fontSize: '24px', marginBottom: '15px' }}>Upcoming Planned Expenses</h3>
                {plannedExpenses.length > 0 ? (
                    <div style={{ 
                        maxWidth: '800px', 
                        margin: '0 auto',
                        padding: '10px',
                        backgroundColor: '#f8f9fa',
                        borderRadius: '8px'
                    }}>
                        {plannedExpenses.map(expense => {
                            const dueDate = new Date(expense.due_date);
                            const isNextMonth = dueDate.getMonth() !== currentMonthIndex;
                            const barWidth = getBarWidth(expense.amount);
                            
                            return (
                                <div key={expense.id} style={{
                                    position: 'relative',
                                    height: '40px',
                                    marginBottom: '10px',
                                    backgroundColor: '#fff',
                                    borderRadius: '4px',
                                    border: '1px solid #ddd'
                                }}>
                                    <div style={{
                                        position: 'absolute',
                                        left: 0,
                                        top: 0,
                                        height: '100%',
                                        width: barWidth,
                                        backgroundColor: getBarColor(expense.classification),
                                        opacity: isNextMonth ? 0.5 : 0.8,
                                        borderRadius: '4px',
                                        transition: 'width 0.3s ease-in-out'
                                    }} />
                                    <div style={{
                                        position: 'absolute',
                                        left: '10px',
                                        right: '10px',
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        zIndex: 1,
                                        padding: '0 5px'
                                    }}>
                                        <div style={{ 
                                            display: 'flex', 
                                            alignItems: 'center', 
                                            gap: '10px',
                                            color: '#000'
                                        }}>
                                            <span>{dueDate.toLocaleDateString('en-BW')}</span>
                                            <span>{expense.description}</span>
                                        </div>
                                        <div style={{ 
                                            color: '#000'
                                        }}>
                                            P{parseFloat(expense.amount).toLocaleString('en-BW')}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <p>No upcoming planned expenses</p>
                )}
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
                <Link to="/planned-expenses">
                    <button>Planned Expenses</button>
                </Link>
            </div>
        </div>
    );
};

export default BudgetManager;
