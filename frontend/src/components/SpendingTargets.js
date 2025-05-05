import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const SpendingTargets = ({ onUpdateTargets, existingTargets }) => {
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

    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
    const [targets, setTargets] = useState({});

    useEffect(() => {
        // Load targets for the selected month or initialize blank fields
        const monthTargets = existingTargets[selectedMonth] || {};
        const initializedTargets = categories.reduce((acc, category) => {
            acc[category] = monthTargets[category] || ''; // Blank if no target is set
            return acc;
        }, {});
        setTargets(initializedTargets);
    }, [selectedMonth, existingTargets]);

    const handleTargetChange = (category, value) => {
        setTargets((prev) => ({
            ...prev,
            [category]: value === '' ? '' : parseFloat(value) || 0, // Allow blank fields
        }));
    };

    const handleSave = () => {
        onUpdateTargets(selectedMonth, targets);
        alert('Spending targets saved!');
    };

    const handleCopyToNextMonth = () => {
        if (selectedMonth < months.length - 1) {
            onUpdateTargets(selectedMonth + 1, targets);
            alert(`Targets copied to ${months[selectedMonth + 1]}!`);
        } else {
            alert('Cannot copy targets to the next month as this is the last month.');
        }
    };

    return (
        <div style={{ maxWidth: '600px', margin: '0 auto', fontFamily: 'Open Sans, sans-serif' }}>
            <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>Spending Targets</h2>
            <div style={{ marginBottom: '20px' }}>
                <label htmlFor="month">Select Month:</label>
                <select
                    id="month"
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(parseInt(e.target.value, 10))}
                    style={{ marginLeft: '10px' }}
                >
                    {months.map((month, index) => (
                        <option key={month} value={index}>
                            {month}
                        </option>
                    ))}
                </select>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
                <thead>
                    <tr>
                        <th style={{ borderBottom: '2px solid #000', padding: '8px' }}>Category</th>
                        <th style={{ borderBottom: '2px solid #000', padding: '8px' }}>Target (P)</th>
                    </tr>
                </thead>
                <tbody>
                    {categories.map((category) => (
                        <tr key={category}>
                            <td style={{ padding: '8px', border: '1px solid #ccc' }}>{category}</td>
                            <td style={{ padding: '8px', border: '1px solid #ccc' }}>
                                <input
                                    type="number"
                                    value={targets[category]}
                                    onChange={(e) => handleTargetChange(category, e.target.value)}
                                    style={{ width: '100%' }}
                                />
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            <button onClick={handleSave} style={{ marginBottom: '10px' }}>
                Save Targets
            </button>
            <button onClick={handleCopyToNextMonth} style={{ marginBottom: '20px' }}>
                Copy to Next Month
            </button>
            <Link to="/budget-manager">
                <button>Back to Budget Manager</button>
            </Link>
        </div>
    );
};

export default SpendingTargets;
