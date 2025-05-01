import React from 'react';
import { Link } from 'react-router-dom';
import { Typography, Box, LinearProgress } from '@mui/material';

const BudgetSummary = () => {
    const totalIncome = 10000; // Placeholder value
    const totalBudgetedExpenses = 7000; // Placeholder value
    const totalActualExpenses = 7500; // Placeholder value
    const variation = totalBudgetedExpenses - totalActualExpenses;

    const variationColor = variation >= 0 ? 'green' : 'red';

    return (
        <div>
            <h2>Budget Summary</h2>

            <Box display="flex" justifyContent="space-around" marginBottom={4}>
                <Box textAlign="center">
                    <Typography variant="h6">Total Income</Typography>
                    <Typography variant="h4" color="primary">${totalIncome.toLocaleString()}</Typography>
                </Box>
                <Box textAlign="center">
                    <Typography variant="h6">Budgeted Expenses</Typography>
                    <Typography variant="h4" color="secondary">${totalBudgetedExpenses.toLocaleString()}</Typography>
                </Box>
                <Box textAlign="center">
                    <Typography variant="h6">Actual Expenses</Typography>
                    <Typography variant="h4" color="error">${totalActualExpenses.toLocaleString()}</Typography>
                </Box>
            </Box>

            <Box marginBottom={4}>
                <Typography variant="h6">Variation</Typography>
                <Box position="relative" height={30}>
                    <LinearProgress
                        variant="determinate"
                        value={(totalActualExpenses / totalBudgetedExpenses) * 100}
                        style={{ height: 30, backgroundColor: variationColor === 'green' ? '#e0f7e9' : '#fdecea' }}
                    />
                    <Box
                        position="absolute"
                        top={0}
                        left={0}
                        right={0}
                        bottom={0}
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                    >
                        <Typography variant="body1" color={variationColor}>
                            {variation >= 0 ? `Under Budget by $${Math.abs(variation).toLocaleString()}` : `Over Budget by $${Math.abs(variation).toLocaleString()}`}
                        </Typography>
                    </Box>
                </Box>
            </Box>

            <Link to="/budget-summary-details">
                <button>Go to Detailed Budget</button>
            </Link>
            <Link to="/budget-manager">
                <button>Back to Budget Manager</button>
            </Link>
        </div>
    );
};

export default BudgetSummary;