import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const SpendingTargets = () => {
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

    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1); // 1-based month
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [targets, setTargets] = useState({});

    useEffect(() => {
        // Fetch targets for the selected month and year
        const fetchTargets = async () => {
            try {
                const response = await fetch(`/api/yearlyTargets?year=${selectedYear}`);
                if (!response.ok) {
                    throw new Error('Failed to fetch targets');
                }
                const data = await response.json();
                const monthTargets = data[selectedYear]?.[selectedMonth] || {};
                const initializedTargets = categories.reduce((acc, category) => {
                    acc[category] = monthTargets[category] || ''; // Blank if no target is set
                    return acc;
                }, {});
                setTargets(initializedTargets);
            } catch (error) {
                console.error('Error fetching targets:', error);
                alert('Failed to load spending targets.');
            }
        };

        fetchTargets();
    }, [selectedMonth, selectedYear]);

    const handleMonthChange = (value) => {
        const [month, year] = value.split('-').map(Number);
        setSelectedMonth(month);
        setSelectedYear(year);
    };

    const generateMonthYearOptions = () => {
        const options = [];
        const currentYear = new Date().getFullYear();

        // Generate options for the past year, current year, and next year
        for (let year = currentYear - 1; year <= currentYear + 1; year++) {
            for (let month = 1; month <= 12; month++) {
                options.push({ month, year });
            }
        }

        return options;
    };

    const handleTargetChange = (category, value) => {
        setTargets((prev) => ({
            ...prev,
            [category]: value === '' ? '' : parseFloat(value) || 0, // Allow blank fields
        }));
    };

    const handleSave = async () => {
        try {
            const response = await fetch('/api/yearlyTargets', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    year: selectedYear,
                    month: selectedMonth,
                    targets,
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to save targets');
            }

            alert('Spending targets saved!');
        } catch (error) {
            console.error('Error saving targets:', error);
            alert('Failed to save spending targets.');
        }
    };

    const handleCopyToNextMonth = async () => {
        if (selectedMonth < months.length) {
            try {
                const response = await fetch('/api/yearlyTargets', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        year: selectedMonth === 12 ? selectedYear + 1 : selectedYear, // Increment year if copying to January
                        month: selectedMonth === 12 ? 1 : selectedMonth + 1, // Set next month, wrap to January if December
                        targets,
                    }),
                });

                if (!response.ok) {
                    throw new Error('Failed to copy targets');
                }

                alert(`Targets copied to ${months[selectedMonth % 12]}!`); // Use modulo to wrap around to January
            } catch (error) {
                console.error('Error copying targets:', error);
                alert('Failed to copy spending targets.');
            }
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
                    value={`${selectedMonth}-${selectedYear}`}
                    onChange={(e) => handleMonthChange(e.target.value)}
                    style={{ marginLeft: '10px' }}
                >
                    {generateMonthYearOptions().map(({ month, year }) => (
                        <option key={`${month}-${year}`} value={`${month}-${year}`}>
                            {months[month - 1]} {year}
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
