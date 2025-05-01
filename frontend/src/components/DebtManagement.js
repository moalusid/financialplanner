import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { LinearProgress } from '@mui/material';

const DebtManagement = () => {
    const [debts, setDebts] = useState([{ id: 1, name: '', balance: 0, interestRate: 0, minPayment: 0, paid: 0 }]);
    const [totalDebt, setTotalDebt] = useState(0);
    const [repaymentStrategy, setRepaymentStrategy] = useState('');

    const addDebtLine = () => {
        setDebts([...debts, { id: debts.length + 1, name: '', balance: 0, interestRate: 0, minPayment: 0, paid: 0 }]);
    };

    const calculateTotalDebt = () => {
        const total = debts.reduce((sum, debt) => sum + debt.balance, 0);
        setTotalDebt(total);

        // Suggest repayment strategy
        const sortedDebts = [...debts].sort((a, b) => a.balance - b.balance);
        setRepaymentStrategy(
            `Start with paying off '${sortedDebts[0].name || 'the smallest debt'}' first to follow the Snowball Method.`
        );
    };

    return (
        <div>
            <Link to="/">Back to Homepage</Link>
            <h2>Debt Management</h2>

            {debts.map((debt, index) => (
                <div key={debt.id}>
                    <input
                        type="text"
                        placeholder={`Debt Name ${index + 1}`}
                        onChange={(e) => {
                            const updatedDebts = debts.map((d) =>
                                d.id === debt.id ? { ...d, name: e.target.value } : d
                            );
                            setDebts(updatedDebts);
                        }}
                    />
                    <input
                        type="number"
                        placeholder={`Balance ${index + 1}`}
                        onChange={(e) => {
                            const updatedDebts = debts.map((d) =>
                                d.id === debt.id ? { ...d, balance: parseFloat(e.target.value) || 0 } : d
                            );
                            setDebts(updatedDebts);
                        }}
                    />
                    <input
                        type="number"
                        placeholder={`Interest Rate (%) ${index + 1}`}
                        onChange={(e) => {
                            const updatedDebts = debts.map((d) =>
                                d.id === debt.id ? { ...d, interestRate: parseFloat(e.target.value) || 0 } : d
                            );
                            setDebts(updatedDebts);
                        }}
                    />
                    <input
                        type="number"
                        placeholder={`Minimum Payment ${index + 1}`}
                        onChange={(e) => {
                            const updatedDebts = debts.map((d) =>
                                d.id === debt.id ? { ...d, minPayment: parseFloat(e.target.value) || 0 } : d
                            );
                            setDebts(updatedDebts);
                        }}
                    />
                    <input
                        type="number"
                        placeholder={`Amount Paid ${index + 1}`}
                        onChange={(e) => {
                            const updatedDebts = debts.map((d) =>
                                d.id === debt.id ? { ...d, paid: parseFloat(e.target.value) || 0 } : d
                            );
                            setDebts(updatedDebts);
                        }}
                    />
                    <LinearProgress
                        variant="determinate"
                        value={(debt.paid / debt.balance) * 100 || 0}
                        style={{ margin: '10px 0' }}
                    />
                </div>
            ))}
            <button onClick={addDebtLine}>Add Debt</button>

            <button onClick={calculateTotalDebt}>Calculate Total Debt</button>
            {totalDebt > 0 && <p>Total Debt: {totalDebt}</p>}

            {repaymentStrategy && <p>Repayment Strategy: {repaymentStrategy}</p>}
        </div>
    );
};

export default DebtManagement;