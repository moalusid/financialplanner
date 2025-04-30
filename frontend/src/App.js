import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import HomePage from './components/HomePage';
import LoanCalculator from './components/LoanCalculator';
import BudgetCalculator from './components/BudgetCalculator';
import DebtManagement from './components/DebtManagement';

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/loan-calculator" element={<LoanCalculator />} />
                <Route path="/budget-calculator" element={<BudgetCalculator />} />
                <Route path="/debt-management" element={<DebtManagement />} />
            </Routes>
        </Router>
    );
}

export default App;
