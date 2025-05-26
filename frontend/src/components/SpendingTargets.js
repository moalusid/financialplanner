import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const SpendingTargets = () => {
    const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December',
    ];

    const categoryGroups = {
        income: ['Salary', 'Other Income'],
        essentials: [
            'Housing',
            'Utilities',
            'Groceries',
            'Transportation',
            'Health & Fitness',
            'Insurance',
            'Debt Payments'
        ],
        savings: ['Savings'],
        nonEssentials: [
            'Dining Out',
            'Entertainment',
            'Shopping',
            'Other'
        ]
    };

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
                const initializedTargets = Object.values(categoryGroups).flat().reduce((acc, category) => {
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

    const calculateTotals = () => {
        const income = Object.entries(targets)
            .filter(([category]) => categoryGroups.income.includes(category))
            .reduce((sum, [_, value]) => sum + (parseFloat(value) || 0), 0);

        const essentials = Object.entries(targets)
            .filter(([category]) => categoryGroups.essentials.includes(category))
            .reduce((sum, [_, value]) => sum + (parseFloat(value) || 0), 0);

        const savings = Object.entries(targets)
            .filter(([category]) => categoryGroups.savings.includes(category))
            .reduce((sum, [_, value]) => sum + (parseFloat(value) || 0), 0);

        const nonEssentials = Object.entries(targets)
            .filter(([category]) => categoryGroups.nonEssentials.includes(category))
            .reduce((sum, [_, value]) => sum + (parseFloat(value) || 0), 0);

        const remaining = income - essentials - savings - nonEssentials;

        return { income, essentials, savings, nonEssentials, remaining };
    };

    const renderCard = (title, categories, backgroundColor = '#fff') => {
        const cardTotal = categories.reduce((sum, category) => 
            sum + (parseFloat(targets[category]) || 0), 0
        );

        return (
            <div style={{
                backgroundColor,
                borderRadius: '8px',
                padding: '20px',
                marginBottom: '20px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}>
                <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    marginBottom: '15px' 
                }}>
                    <h3 style={{ margin: 0 }}>{title}</h3>
                    <span style={{ fontWeight: 'bold' }}>
                        P{cardTotal.toLocaleString()}
                    </span>
                </div>
                {categories.map(category => (
                    <div key={category} style={{
                        backgroundColor: 'white',
                        padding: '10px',
                        marginBottom: '10px',
                        borderRadius: '4px',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span>{category}</span>
                            <input
                                type="number"
                                value={targets[category] || ''}
                                onChange={(e) => handleTargetChange(category, e.target.value)}
                                style={{ width: '120px', padding: '5px' }}
                            />
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    const totals = calculateTotals();

    return (
        <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px', fontFamily: 'Open Sans, sans-serif' }}>
            <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>Spending Targets</h2>
            
            {/* Month Selector */}
            <div style={{ marginBottom: '20px', textAlign: 'center' }}>
                <select
                    value={`${selectedMonth}-${selectedYear}`}
                    onChange={(e) => handleMonthChange(e.target.value)}
                    style={{ padding: '8px', marginBottom: '20px' }}
                >
                    {generateMonthYearOptions().map(({ month, year }) => (
                        <option key={`${month}-${year}`} value={`${month}-${year}`}>
                            {months[month - 1]} {year}
                        </option>
                    ))}
                </select>
            </div>

            {/* Running Total Display */}
            <div style={{
                position: 'sticky',
                top: '0',
                backgroundColor: '#f8f9fa',
                padding: '15px',
                marginBottom: '20px',
                borderRadius: '8px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                zIndex: 1000
            }}>
                <h3>Monthly Overview</h3>
                <div>Total Income: P{totals.income.toLocaleString()}</div>
                <div>Remaining: P{totals.remaining.toLocaleString()}</div>
            </div>

            {/* Cards */}
            {renderCard('Income', categoryGroups.income, '#e3f2fd')}
            {renderCard('Essentials', categoryGroups.essentials, '#e8f5e9')}
            {renderCard('Savings', categoryGroups.savings, '#fff3e0')}
            {renderCard('Non-Essentials', categoryGroups.nonEssentials, '#fce4ec')}

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                <button onClick={handleSave} style={{ flex: 1 }}>Save Targets</button>
                <button onClick={handleCopyToNextMonth} style={{ flex: 1 }}>Copy to Next Month</button>
                <Link to="/budget-manager" style={{ flex: 1 }}>
                    <button style={{ width: '100%' }}>Back to Dashboard</button>
                </Link>
            </div>
        </div>
    );
};

export default SpendingTargets;
