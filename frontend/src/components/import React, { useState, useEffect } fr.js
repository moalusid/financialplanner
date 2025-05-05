import React, { useState, useEffect } from 'react';

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
        months.map((_, monthIndex) =>
            categories.reduce((acc, category) => {
                acc[category] = {
                    target: yearlyTargets?.[monthIndex]?.[category] || 0,
                    actual: 0,
                };
                return acc;
            }, {})
        )
    );

    useEffect(() => {
        console.log('Transactions:', transactions); // Debugging log
        console.log('Yearly Targets:', yearlyTargets); // Debugging log

        const updatedData = [...monthlyData];
        transactions.forEach((transaction) => {
            const transactionDate = new Date(transaction.date);
            const transactionMonth = transactionDate.getMonth();
            const category = transaction.category || 'Other';

            if (transactionMonth >= 0 && transactionMonth < months.length) {
                updatedData[transactionMonth][category].actual += transaction.amount;
            }
        });

        setMonthlyData(updatedData);
        console.log('Monthly Data:', updatedData); // Debugging log
    }, [transactions, yearlyTargets]);

    if (!yearlyTargets || yearlyTargets.length === 0) {
        return <p style={{ textAlign: 'center' }}>No spending targets set. Please set targets in the Spending Targets page.</p>;
    }

    return (
        <div style={{ maxWidth: '1000px', margin: '0 auto', fontFamily: 'Open Sans, sans-serif' }}>
            <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>Yearly Budget</h2>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
                <thead>
                    <tr>
                        <th style={{ borderBottom: '2px solid #000', padding: '8px' }}>Category</th>
                        {months.map((month) => (
                            <th key={month} style={{ borderBottom: '2px solid #000', padding: '8px' }}>
                                {month}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {categories.map((category) => (
                        <tr key={category}>
                            <td style={{ padding: '8px', border: '1px solid #ccc', fontWeight: 'bold' }}>
                                {category}
                            </td>
                            {months.map((_, monthIndex) => {
                                const monthData = monthlyData[monthIndex][category];
                                const difference = monthData.actual - monthData.target;
                                return (
                                    <td key={monthIndex} style={{ padding: '8px', border: '1px solid #ccc' }}>
                                        <div>
                                            <strong>Target:</strong> P{monthData.target.toLocaleString()}
                                        </div>
                                        <div>
                                            <strong>Actual:</strong> P{monthData.actual.toLocaleString()}
                                        </div>
                                        <div
                                            style={{
                                                color: difference >= 0 ? 'green' : 'red',
                                            }}
                                        >
                                            <strong>Diff:</strong> P{difference.toLocaleString()}
                                        </div>
                                    </td>
                                );
                            })}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default YearlyBudget;
