import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import HomePage from './components/HomePage';
import LoanCalculator from './components/LoanCalculator';
import BudgetCalculator from './components/BudgetCalculator';
import DebtManagement from './components/DebtManagement';
import BudgetSummary from './components/BudgetSummary';
import BudgetManager from './components/BudgetManager';
import AddTransaction from './components/AddTransaction';
import BudgetDetails from './components/BudgetDetails';
import EditTransaction from './components/EditTransaction';

function App() {
    const [transactions, setTransactions] = useState(() => {
        // Load transactions from localStorage on initial render
        const savedTransactions = localStorage.getItem('transactions');
        return savedTransactions ? JSON.parse(savedTransactions) : [];
    });

    useEffect(() => {
        // Save transactions to localStorage whenever they change
        localStorage.setItem('transactions', JSON.stringify(transactions));
    }, [transactions]);

    const handleAddTransaction = (transaction) => {
        setTransactions([...transactions, transaction]);
    };

    const handleUpdateTransaction = (updatedTransaction) => {
        setTransactions(
            transactions.map((transaction) =>
                transaction.description === updatedTransaction.description ? updatedTransaction : transaction
            )
        );
    };

    return (
        <Router>
            <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/loan-calculator" element={<LoanCalculator />} />
                <Route path="/budget-manager" element={<BudgetManager transactions={transactions} />} />
                <Route path="/add-transaction" element={<AddTransaction onAddTransaction={handleAddTransaction} />} />
                <Route
                    path="/budget-details"
                    element={
                        <BudgetDetails
                            transactions={transactions}
                            onUpdateTransactions={setTransactions}
                        />
                    }
                />
                <Route path="/edit-transaction" element={<EditTransaction onUpdateTransaction={handleUpdateTransaction} />} />
                <Route path="/debt-management" element={<DebtManagement />} />
            </Routes>
        </Router>
    );
}

export default App;
