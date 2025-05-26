import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const AddTransaction = ({ onAddTransaction }) => {
    const [activeSection, setActiveSection] = useState('income'); // Track active section
    const navigate = useNavigate();
    const [transaction, setTransaction] = useState({
        date: '',
        category: '',
        description: '',
        amount: ''
    });

    const sections = {
        income: { title: 'Income', type: 'income', classification: 'Income' },
        essentials: { title: 'Essentials', type: 'expense', classification: 'Essentials' },
        savings: { title: 'Savings', type: 'expense', classification: 'Savings' },
        nonEssentials: { title: 'Non Essentials', type: 'expense', classification: 'Non Essentials' }
    };

    const handleAddTransaction = async (resetAfterAdd = true) => {
        if (!transaction.category || !transaction.date) {
            alert('Please fill in all required fields.');
            return;
        }
        if (!transaction.amount) {
            alert('Please enter an amount.');
            return;
        }

        const currentSection = sections[activeSection];
        const transactionData = {
            ...transaction,
            type: currentSection.type,
            classification: currentSection.classification,
            amount: parseFloat(transaction.amount)
        };
        
        console.log('Section:', activeSection);
        console.log('Classification:', currentSection.classification);
        console.log('Full transaction data:', transactionData);

        try {
            const response = await fetch('/api/transactions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(transactionData),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`Failed to save transaction: ${errorData.message || response.statusText}`);
            }

            const savedTransaction = await response.json();
            console.log('Saved transaction:', savedTransaction); // Debug log
            onAddTransaction(savedTransaction);

            if (resetAfterAdd) {
                navigate('/budget-manager');
            } else {
                alert('Transaction saved successfully!');
                setTransaction({ date: '', category: '', description: '', amount: '' });
            }
        } catch (error) {
            console.error('Error saving transaction:', error);
            alert('An error occurred while saving the transaction.');
        }
    };

    const getCategoriesForSection = (section) => {
        if (section === 'income') {
            return ['Salary', 'Other Income'];
        }
        return [
            'Housing', 'Utilities', 'Groceries', 'Transportation',
            'Dining Out', 'Entertainment', 'Shopping', 'Health & Fitness',
            'Debt Payments', 'Insurance', 'Savings', 'Other'
        ];
    };

    const getPlaceholderForSection = (section) => {
        switch (section) {
            case 'income':
                return "Main job, investment, side business, etc.";
            case 'essentials':
                return "Rent, water, electricity, etc.";
            case 'savings':
                return "Emergency fund, holiday fund, deposit for house, etc.";
            case 'nonEssentials':
                return "Netflix, dining out, designer clothes, etc.";
            default:
                return "Description";
        }
    };

    return (
        <div style={{ 
            maxWidth: '500px', 
            margin: '40px auto', 
            padding: '30px', 
            fontFamily: 'Open Sans, sans-serif',
            backgroundColor: '#fff',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
            <h2 style={{ textAlign: 'center', marginBottom: '30px', color: '#333' }}>Add Transaction</h2>
            
            {/* Section Navigation */}
            <div style={{ 
                display: 'flex', 
                justifyContent: 'center',
                gap: '10px', 
                marginBottom: '30px',
                flexWrap: 'wrap'
            }}>
                {Object.entries(sections).map(([key, { title }]) => (
                    <button
                        key={key}
                        onClick={() => setActiveSection(key)}
                        style={{
                            padding: '10px 20px',
                            backgroundColor: activeSection === key ? '#4CAF50' : '#f0f0f0',
                            color: activeSection === key ? 'white' : 'black',
                            border: 'none',
                            borderRadius: '5px',
                            cursor: 'pointer',
                            transition: 'background-color 0.2s',
                            minWidth: '120px'
                        }}
                    >
                        {title}
                    </button>
                ))}
            </div>

            {/* Input Fields */}
            <div style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                gap: '15px',
                marginBottom: '30px'
            }}>
                <input
                    type="date"
                    value={transaction.date}
                    onChange={(e) => setTransaction({ ...transaction, date: e.target.value })}
                    style={{ 
                        padding: '12px',
                        borderRadius: '4px',
                        border: '1px solid #ddd',
                        fontSize: '14px'
                    }}
                />
                <select
                    value={transaction.category}
                    onChange={(e) => setTransaction({ ...transaction, category: e.target.value })}
                    style={{ 
                        padding: '12px',
                        borderRadius: '4px',
                        border: '1px solid #ddd',
                        fontSize: '14px'
                    }}
                >
                    <option value="" disabled>Select Category</option>
                    {getCategoriesForSection(activeSection).map(category => (
                        <option key={category} value={category}>{category}</option>
                    ))}
                </select>
                <input
                    type="text"
                    placeholder={getPlaceholderForSection(activeSection)}
                    value={transaction.description}
                    onChange={(e) => setTransaction({ ...transaction, description: e.target.value })}
                    style={{ 
                        padding: '12px',
                        borderRadius: '4px',
                        border: '1px solid #ddd',
                        fontSize: '14px'
                    }}
                />
                <input
                    type="number"
                    placeholder="Amount"
                    value={transaction.amount}
                    onChange={(e) => setTransaction({ ...transaction, amount: e.target.value })}
                    style={{ 
                        padding: '12px',
                        borderRadius: '4px',
                        border: '1px solid #ddd',
                        fontSize: '14px'
                    }}
                />
            </div>

            {/* Action Buttons */}
            <div style={{ 
                display: 'flex', 
                gap: '10px',
                justifyContent: 'center'
            }}>
                <button 
                    onClick={() => handleAddTransaction(false)}
                    style={{
                        padding: '12px 24px',
                        backgroundColor: '#4CAF50',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: '600'
                    }}
                >
                    Save
                </button>
                <Link to="/budget-manager">
                    <button style={{
                        padding: '12px 24px',
                        backgroundColor: '#f44336',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: '600'
                    }}>
                        Back to Dashboard
                    </button>
                </Link>
            </div>
        </div>
    );
};

export default AddTransaction;
