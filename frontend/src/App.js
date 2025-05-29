import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import HomePage from './components/HomePage';
import LoanCalculator from './components/LoanCalculator';
import BudgetCalculator from './components/BudgetCalculator';
import DebtManagement from './components/DebtManagement';
import BudgetManager from './components/BudgetManager';
import AddTransaction from './components/AddTransaction';
import BudgetDetails from './components/BudgetDetails';
import EditTransaction from './components/EditTransaction';
import YearlyBudget from './components/YearlyBudget';
import SpendingTargets from './components/SpendingTargets';
import AddDebtType from './components/AddDebtType';
import AddFixedDebt from './components/AddFixedDebt';
import AddRevolvingDebt from './components/AddRevolvingDebt';
import DebtDetails from './components/DebtDetails';
import DebtInsights from './components/DebtInsights';
import PlannedExpenses from './components/PlannedExpenses';
import DebtList from './components/DebtList';

function App() {
    const [transactions, setTransactions] = useState(() => {
        // Load transactions from localStorage on initial render
        const savedTransactions = localStorage.getItem('transactions');
        return savedTransactions ? JSON.parse(savedTransactions) : [];
    });

    const [yearlyTargets, setYearlyTargets] = useState(() => {
        const savedTargets = localStorage.getItem('yearlyTargets');
        return savedTargets ? JSON.parse(savedTargets) : Array(12).fill({}); // Ensure yearlyTargets is initialized
    });

    useEffect(() => {
        // Save transactions to localStorage whenever they change
        localStorage.setItem('transactions', JSON.stringify(transactions));
    }, [transactions]);

    const handleAddTransaction = (transaction) => {
        const updatedTransactions = [...transactions, transaction];
        setTransactions(updatedTransactions);
        localStorage.setItem('transactions', JSON.stringify(updatedTransactions));
    };

    const handleUpdateTransaction = (updatedTransaction) => {
        setTransactions(
            transactions.map((transaction) =>
                transaction.description === updatedTransaction.description ? updatedTransaction : transaction
            )
        );
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
                <Route path="/yearly-budget" element={<YearlyBudget transactions={transactions} yearlyTargets={yearlyTargets} />} />
                <Route
                    path="/spending-targets"
                    element={
                        <SpendingTargets
                            onUpdateTargets={handleUpdateTargets}
                            existingTargets={yearlyTargets}
                        />
                    }
                />
                <Route path="/add-debt-type" element={<AddDebtType />} />
                <Route path="/add-fixed-debt" element={<AddFixedDebt />} />
                <Route path="/add-revolving-debt" element={<AddRevolvingDebt />} />
                <Route path="/debt-details/:id" element={<DebtDetails />} />
                <Route path="/debt-insights" element={<DebtInsights />} />
                <Route path="/planned-expenses" element={<PlannedExpenses />} />
                <Route path="/debt-list" element={<DebtList />} />
            </Routes>
        </Router>
    );
}

export default App;
