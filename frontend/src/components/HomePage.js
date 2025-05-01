import React from 'react';
import { Link } from 'react-router-dom';

const HomePage = () => {
    return (
        <div>
            <h1>Welcome to My Financial Planner</h1>
            <div style={{ display: 'flex', gap: '20px' }}>
                <div style={{ border: '1px solid #ccc', padding: '20px' }}>
                    <h2>Loan Calculator</h2>
                    <p>Calculate your loan payments easily.</p>
                    <Link to="/loan-calculator">Go to Loan Calculator</Link>
                </div>
                <div style={{ border: '1px solid #ccc', padding: '20px' }}>
                    <h2>Budgeting</h2>
                    <p>Manage your income and expenses effectively.</p>
                    <Link to="/budget-manager">Manage My Budget</Link>
                </div>
                <div style={{ border: '1px solid #ccc', padding: '20px' }}>
                    <h2>Debt Management</h2>
                    <p>Track and manage your debts efficiently.</p>
                    <Link to="/debt-management">Go to Debt Management</Link>
                </div>
            </div>
        </div>
    );
};

export default HomePage;