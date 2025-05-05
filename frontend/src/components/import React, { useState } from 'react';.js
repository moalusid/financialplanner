import React, { useState } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import HomePage from './components/HomePage';
import BudgetManager from './components/BudgetManager';
import AddTransaction from './components/AddTransaction';
import BudgetDetails from './components/BudgetDetails';
import YearlyBudget from './components/YearlyBudget';
import SpendingTargets from './components/SpendingTargets';

function App() {
    const [transactions, setTransactions] = useState(() => {
        const savedTransactions = localStorage.getItem('transactions');
        return savedTransactions ? JSON.parse(savedTransactions) : [];
    });

    const [yearlyTargets, setYearlyTargets] = useState(() => {
        const savedTargets = localStorage.getItem('yearlyTargets');
        return savedTargets ? JSON.parse(savedTargets) : Array(12).fill({}); // Ensure yearlyTargets is initialized
    });

    console.log('Transactions:', transactions); // Debugging log
    console.log('Yearly Targets:', yearlyTargets); // Debugging log

    const handleAddTransaction = (transaction) => {
        const updatedTransactions = [...transactions, transaction];
        setTransactions(updatedTransactions);
        localStorage.setItem('transactions', JSON.stringify(updatedTransactions));
    };

    const handleUpdateTransactions = (updatedTransactions) => {
        setTransactions(updatedTransactions);
        localStorage.setItem('transactions', JSON.stringify(updatedTransactions));
    };

    const handleUpdateTargets = (month, targets) => {
        const updatedTargets = [...yearlyTargets];
        updatedTargets[month] = targets;
        setYearlyTargets(updatedTargets);
        localStorage.setItem('yearlyTargets', JSON.stringify(updatedTargets));
    };

    return (
        <Router>
            <Routes>
                <Route path="/" element={<HomePage />} />
                <Route
                    path="/budget-manager"
                    element={<BudgetManager transactions={transactions} />}
                />
                <Route
                    path="/add-transaction"
                    element={<AddTransaction onAddTransaction={handleAddTransaction} />}
                />
                <Route
                    path="/budget-details"
                    element={
                        <BudgetDetails
                            transactions={transactions}
                            onUpdateTransactions={handleUpdateTransactions}
                        />
                    }
                />
                <Route
                    path="/yearly-budget"
                    element={
                        <YearlyBudget
                            transactions={transactions}
                            yearlyTargets={yearlyTargets} // Ensure yearlyTargets is passed correctly
                        />
                    }
                />
                <Route
                    path="/spending-targets"
                    element={
                        <SpendingTargets
                            onUpdateTargets={handleUpdateTargets}
                            existingTargets={yearlyTargets} // Ensure yearlyTargets is passed correctly
                        />
                    }
                />
            </Routes>
        </Router>
    );
}

export default App;
