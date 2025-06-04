import React, { useState, useEffect } from 'react';
import { 
    Typography, Box, Grid, Card, CardContent, FormControl,
    InputLabel, Select, MenuItem, Button, TextField, Slider,
    Table, TableBody, TableCell, TableContainer, TableHead, 
    TableRow, Paper, Tabs, Tab, Divider, Stack
} from '@mui/material';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';
import { Add as AddIcon, Remove as RemoveIcon } from '@mui/icons-material';
import { calculatePayoffDetails, calculateRequiredPayment } from '../utils/financialCalculations';
import { Link } from 'react-router-dom';

// Register ChartJS components
ChartJS.register(
    CategoryScale, LinearScale, PointElement, LineElement,
    BarElement, ArcElement, Title, Tooltip, Legend
);

const DebtInsights = () => {
    const [currentTab, setCurrentTab] = useState(0);
    const [debts, setDebts] = useState([]);
    const [scenarioDebt, setScenarioDebt] = useState(null);
    const [interestChange, setInterestChange] = useState(0);
    const [rateChangeType, setRateChangeType] = useState('increase');
    const [newRateInput, setNewRateInput] = useState('');

    // New states for enhanced features
    const [paymentStrategy, setPaymentStrategy] = useState('avalanche');
    const [extraMonthlyPayment, setExtraMonthlyPayment] = useState(0);
    const [inflationRate, setInflationRate] = useState(2);
    const [payoffGoalDate, setPayoffGoalDate] = useState(null);

    // Update rate options to ensure consistent string format
    const rateOptions = Array.from({ length: 10 }, (_, i) => {
        const value = ((i + 1) * 0.5).toFixed(1);
        return { value, label: `${value}%` };
    });

    const [extraDebt, setExtraDebt] = useState(null);
    const [extraAmount, setExtraAmount] = useState(0);
    const [frequency, setFrequency] = useState('monthly');

    // Add new state for input value
    const [extraAmountInput, setExtraAmountInput] = useState('');

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-BW', {
            style: 'currency',
            currency: 'BWP',
        }).format(amount);
    };

    const formatDate = (date) => {
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(date).toLocaleDateString(undefined, options);
    };

    const calculateTotalCost = (debt) => {
        if (!debt) return { totalCost: 0, months: 0 };
        const monthlyRate = debt.interest_rate / 100 / 12;
        let balance = debt.balance;
        let totalCost = 0;
        let months = 0;

        while (balance > 0 && months < 600) {
            const interest = balance * monthlyRate;
            const payment = Math.min(debt.min_payment, balance + interest);
            totalCost += payment;
            balance = balance + interest - payment;
            months++;
        }

        return { totalCost, months };
    };

    const calculateWhatIfScenario = () => {
        if (!scenarioDebt) return null;
        
        const newInterestRate = parseFloat(scenarioDebt.interest_rate) + interestChange;
        const payment = parseFloat(scenarioDebt.min_payment);
        
        let balance = parseFloat(scenarioDebt.balance);
        let months = 0;
        let totalInterest = 0;
        
        while (balance > 0 && months < 600) {
            const monthlyInterest = (balance * (newInterestRate / 100)) / 12;
            totalInterest += monthlyInterest;
            balance = balance + monthlyInterest - payment;
            months++;
        }
        
        return {
            months,
            totalInterest,
            projectedPayoffDate: new Date(Date.now() + (months * 30.44 * 24 * 60 * 60 * 1000))
        };
    };

    const calculateExtraPaymentImpact = (balance, rate, basePayment, extraPayment) => {
        try {
            const originalScenario = calculatePayoffDetails(balance, rate, basePayment);
            const newScenario = calculatePayoffDetails(balance, rate, basePayment + extraPayment);

            if (!originalScenario || !newScenario) return null;

            const savedDays = originalScenario.totalDays - newScenario.totalDays;
            const savedMonths = Math.floor(savedDays / 30);
            const remainingDays = savedDays % 30;

            return {
                originalDate: originalScenario.payoffDate,
                modifiedDate: newScenario.payoffDate,
                originalInterest: originalScenario.totalInterest,
                modifiedInterest: newScenario.totalInterest,
                savedMonths,
                savedDays: remainingDays
            };
        } catch (error) {
            console.error('Error calculating impact:', error);
            return null;
        }
    };

    useEffect(() => {
        let mounted = true;
        const controller = new AbortController();

        const fetchDebts = async () => {
            try {
                const response = await fetch('/api/debts', {
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    },
                    credentials: 'include',
                    signal: controller.signal
                });
                
                if (!response.ok) {
                    throw new Error('Failed to fetch debts');
                }
                
                const data = await response.json();
                if (mounted) {
                    setDebts(data);
                }
            } catch (error) {
                if (error.name === 'AbortError') {
                    return;
                }
                console.error('Error fetching debts:', error);
            }
        };

        fetchDebts();

        return () => {
            mounted = false;
            controller.abort();
        };
    }, []);

    // Add useEffect for debouncing near other useEffects
    useEffect(() => {
        const timer = setTimeout(() => {
            const value = extraAmountInput.replace(/[^\d]/g, '');
            setExtraAmount(value ? parseInt(value, 10) : 0);
        }, 500);

        return () => clearTimeout(timer);
    }, [extraAmountInput]);

    const calculateTotalInterest = (debt) => {
        if (!debt) return 0;
        const monthlyRate = debt.interest_rate / 100 / 12;
        const totalMonths = debt.duration || 
            Math.ceil(debt.balance / debt.min_payment);
        let balance = debt.balance;
        let totalInterest = 0;

        for (let i = 0; i < totalMonths; i++) {
            const interest = balance * monthlyRate;
            totalInterest += interest;
            balance = balance - debt.min_payment + interest;
            if (balance <= 0) break;
        }

        return totalInterest;
    };

    const generatePayoffTimeline = (debt1, debt2) => {
        const months = [];
        const balances1 = [];
        const balances2 = [];
        
        let balance1 = debt1.balance;
        let balance2 = debt2.balance;
        const rate1 = debt1.interest_rate / 100 / 12;
        const rate2 = debt2.interest_rate / 100 / 12;
        
        for (let i = 0; i <= 24; i++) {
            months.push(`Month ${i}`);
            balances1.push(balance1);
            balances2.push(balance2);
            
            balance1 = Math.max(0, balance1 * (1 + rate1) - debt1.min_payment);
            balance2 = Math.max(0, balance2 * (1 + rate2) - debt2.min_payment);
        }
        
        return {
            labels: months,
            datasets: [
                {
                    label: debt1.name,
                    data: balances1,
                    borderColor: 'rgb(75, 192, 192)',
                    tension: 0.1
                },
                {
                    label: debt2.name,
                    data: balances2,
                    borderColor: 'rgb(255, 99, 132)',
                    tension: 0.1
                }
            ]
        };
    };

    const generateInterestImpactChart = () => {
        if (!scenarioDebt) return null;
        
        const labels = [];
        const originalData = [];
        const modifiedData = [];
        const monthlyRate = scenarioDebt.interest_rate / 100 / 12;
        const newRate = (scenarioDebt.interest_rate + interestChange) / 100 / 12;
        let balanceOriginal = scenarioDebt.balance;
        let balanceModified = scenarioDebt.balance;
        
        for (let i = 0; i <= 12; i++) {
            labels.push(`Month ${i}`);
            originalData.push(balanceOriginal);
            modifiedData.push(balanceModified);
            
            balanceOriginal = Math.max(0, balanceOriginal * (1 + monthlyRate) - scenarioDebt.min_payment);
            balanceModified = Math.max(0, balanceModified * (1 + newRate) - scenarioDebt.min_payment);
        }
        
        return {
            labels,
            datasets: [
                {
                    label: 'Original Interest Rate',
                    data: originalData,
                    borderColor: 'rgb(75, 192, 192)',
                    tension: 0.1
                },
                {
                    label: 'Modified Interest Rate',
                    data: modifiedData,
                    borderColor: 'rgb(255, 99, 132)',
                    tension: 0.1
                }
            ]
        };
    };

    const generateStrategyComparisonChart = () => {
        // ... rest of existing code ...
    };

    const calculateDaysDifference = (date1, date2) => {
        return Math.abs(Math.ceil((date2 - date1) / (1000 * 60 * 60 * 24)));
    };

    const formatTimeRemaining = (months) => {
        const years = Math.floor(months / 12);
        const remainingMonths = months % 12;
        if (years === 0) return `${remainingMonths} months`;
        return years === 1 
            ? `1 year ${remainingMonths > 0 ? `and ${remainingMonths} months` : ''}`
            : `${years} years ${remainingMonths > 0 ? `and ${remainingMonths} months` : ''}`;
    };

    const calculateScenarioPayoffDate = (balance, rate, payment) => {
        try {
            if (!balance || !rate || !payment || balance <= 0 || payment <= 0) {
                return null;
            }

            let remainingBalance = Number(balance);
            let months = 0;
            const monthlyRate = Number(rate) / 100 / 12;
            const maxIterations = 600;

            // Verify minimum payment covers at least interest
            const monthlyInterest = remainingBalance * monthlyRate;
            if (payment <= monthlyInterest) {
                return null; // Debt will never be paid off
            }

            while (remainingBalance > 0.01 && months < maxIterations) {
                const interest = remainingBalance * monthlyRate;
                remainingBalance = remainingBalance + interest - payment;
                months++;

                if (!isFinite(remainingBalance) || isNaN(remainingBalance)) {
                    return null;
                }
            }

            if (months >= maxIterations) {
                return null;
            }

            const today = new Date();
            return new Date(today.setMonth(today.getMonth() + months));
        } catch (error) {
            console.error('Calculation error:', error);
            return null;
        }
    };

    const calculatePayoffDateAndInterest = (balance, rate, payment) => {
        try {
            // Input validation
            if (!balance || !rate || !payment || balance <= 0 || payment <= 0) {
                return null;
            }

            // Initialize variables
            let remainingBalance = Number(balance);
            let months = 0;
            let totalInterest = 0;
            let days = 0;
            const monthlyRate = Number(rate) / 100 / 12;

            // Check if payment covers initial interest
            const initialMonthlyInterest = remainingBalance * monthlyRate;
            if (payment <= initialMonthlyInterest) {
                return null;
            }

            // For large loans, use mathematical formula first
            const P = remainingBalance;
            const r = monthlyRate;
            const PMT = payment;

            // Calculate months using loan amortization formula: n = -log(1 - (P*r)/PMT) / log(1 + r)
            const monthsCalculated = Math.ceil(-Math.log(1 - (P * r) / PMT) / Math.log(1 + r));
            
            if (monthsCalculated > 600) {
                return null; // Loan takes too long to pay off (>50 years)
            }

            // Calculate total interest using the known number of months
            totalInterest = (PMT * monthsCalculated) - P;

            // Calculate final date
            const startDate = new Date();
            const payoffDate = new Date(startDate);
            payoffDate.setMonth(startDate.getMonth() + monthsCalculated);

            return {
                payoffDate,
                totalInterest,
                months: monthsCalculated,
                days: 0
            };

        } catch (error) {
            console.error('Calculation error:', error);
            return null;
        }
    };

    const formatDetailedTime = (months, days) => {
        const years = Math.floor(months / 12);
        const remainingMonths = months % 12;
        let result = [];
        
        if (years > 0) {
            result.push(`${years} ${years === 1 ? 'year' : 'years'}`);
        }
        if (remainingMonths > 0) {
            result.push(`${remainingMonths} ${remainingMonths === 1 ? 'month' : 'months'}`);
        }
        if (days > 0) {
            result.push(`${days} ${days === 1 ? 'day' : 'days'}`);
        }
        
        return result.join(' and ');
    };

    const ScenarioResults = () => {
        const currentCalc = calculatePayoffDetails(
            scenarioDebt.balance,
            scenarioDebt.interest_rate,
            scenarioDebt.min_payment
        );

        const modifiedCalc = calculatePayoffDetails(
            scenarioDebt.balance,
            Number(newRateInput),
            scenarioDebt.min_payment
        );

        // Required payment to maintain same payoff period
        const currentMonths = currentCalc?.months || 0;
        const requiredPayment = calculateRequiredPayment(
            scenarioDebt.balance,
            scenarioDebt.interest_rate,
            Number(newRateInput),
            scenarioDebt.min_payment
        );

        if (!currentCalc || !modifiedCalc) {
            return (
                <Card sx={{ bgcolor: '#ffebee' }}>
                    <CardContent>
                        <Typography variant="h6" color="error">
                            Unable to Calculate Scenario
                        </Typography>
                        <Typography variant="body1">
                            The payment amount may be too low to pay off the debt with the given interest rate.
                        </Typography>
                    </CardContent>
                </Card>
            );
        }

        const savedDays = currentCalc.totalDays - modifiedCalc.totalDays;
        const isEarlier = modifiedCalc.payoffDate < currentCalc.payoffDate;

        return (
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                <Card sx={{ 
                    maxWidth: 800, 
                    width: '100%', 
                    bgcolor: '#f8f9fa',
                }}>
                    <CardContent sx={{ 
                        p: 3,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center'
                    }}>
                        <Typography variant="h6" gutterBottom align="center" sx={{ mb: 3 }}>
                            Scenario Comparison
                        </Typography>
                        <Box sx={{ width: '100%', maxWidth: 700 }}>
                            <Grid container spacing={3}>
                                <Grid item xs={12} md={6}>
                                    <Card sx={{ 
                                        height: '100%', 
                                        bgcolor: '#e3f2fd',
                                        display: 'flex',
                                        flexDirection: 'column'
                                    }}>
                                        <CardContent sx={{ p: 2, flex: 1 }}>
                                            <Typography variant="h6" color="primary" gutterBottom>
                                                Current Scenario
                                            </Typography>
                                            <Stack spacing={2} divider={<Divider flexItem />}>
                                                <Box>
                                                    <Typography variant="body2" color="textSecondary">Interest Rate</Typography>
                                                    <Typography variant="body1">{scenarioDebt.interest_rate}%</Typography>
                                                </Box>
                                                <Box>
                                                    <Typography variant="body2" color="textSecondary">Monthly Payment</Typography>
                                                    <Typography variant="body1">{formatCurrency(scenarioDebt.min_payment)}</Typography>
                                                </Box>
                                                <Box>
                                                    <Typography variant="body2" color="textSecondary">Payoff Date</Typography>
                                                    <Typography variant="body1">{formatDate(currentCalc.payoffDate)}</Typography>
                                                </Box>
                                                <Box>
                                                    <Typography variant="body2" color="textSecondary">Total Interest</Typography>
                                                    <Typography variant="body1">{formatCurrency(currentCalc.totalInterest)}</Typography>
                                                </Box>
                                            </Stack>
                                        </CardContent>
                                    </Card>
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <Card sx={{ 
                                        height: '100%', 
                                        bgcolor: '#fff3e0',
                                        display: 'flex',
                                        flexDirection: 'column'
                                    }}>
                                        <CardContent sx={{ p: 2, flex: 1 }}>
                                            <Typography variant="h6" color="secondary" gutterBottom>
                                                Modified Scenario
                                            </Typography>
                                            <Stack spacing={2} divider={<Divider flexItem />}>
                                                <Box>
                                                    <Typography variant="body2" color="textSecondary">Interest Rate</Typography>
                                                    <Typography variant="body1">{(Number(newRateInput)).toFixed(2)}%</Typography>
                                                </Box>
                                                <Box>
                                                    <Typography variant="body2" color="textSecondary">Required Monthly Payment*</Typography>
                                                    <Typography variant="body1">{formatCurrency(requiredPayment)}</Typography>
                                                </Box>
                                                <Box>
                                                    <Typography variant="body2" color="textSecondary">Payoff Date**</Typography>
                                                    <Typography variant="body1">{formatDate(modifiedCalc.payoffDate)}</Typography>
                                                </Box>
                                                <Box>
                                                    <Typography variant="body2" color="textSecondary">Total Interest</Typography>
                                                    <Typography variant="body1">{formatCurrency(modifiedCalc.totalInterest)}</Typography>
                                                </Box>
                                            </Stack>
                                        </CardContent>
                                    </Card>
                                </Grid>
                                <Grid item xs={12}>
                                    <Card sx={{ 
                                        bgcolor: '#fce4ec',
                                        height: '100%',
                                        display: 'flex',
                                        flexDirection: 'column'
                                    }}>
                                        <CardContent sx={{ p: 2, flex: 1 }}>
                                            <Typography variant="h6" color="primary" gutterBottom>
                                                Impact Analysis
                                            </Typography>
                                            <Stack spacing={2} divider={<Divider flexItem />}>
                                                <Box>
                                                    <Typography variant="body2" color="textSecondary">Rate Impact</Typography>
                                                    <Typography variant="body1">{(Number(newRateInput) - scenarioDebt.interest_rate).toFixed(2)}% change</Typography>
                                                </Box>
                                                <Box>
                                                    <Typography variant="body2" color="textSecondary">Payment Impact</Typography>
                                                    <Typography variant="body1" color={requiredPayment > scenarioDebt.min_payment ? "error" : "success"}>
                                                        {requiredPayment > scenarioDebt.min_payment ? '+' : ''}{formatCurrency(requiredPayment - scenarioDebt.min_payment)}
                                                    </Typography>
                                                </Box>
                                                <Box>
                                                    <Typography variant="body2" color="textSecondary">Time Impact</Typography>
                                                    <Typography variant="body1">
                                                        {isEarlier ? 'Earlier by ' : 'Later by '} 
                                                        {Math.abs(savedDays)} days
                                                    </Typography>
                                                </Box>
                                                <Box>
                                                    <Typography variant="body2" color="textSecondary">Interest Impact</Typography>
                                                    <Typography variant="body1">
                                                        {modifiedCalc.totalInterest < currentCalc.totalInterest ? 'Saves ' : 'Adds '} 
                                                        {formatCurrency(Math.abs(modifiedCalc.totalInterest - currentCalc.totalInterest))}
                                                    </Typography>
                                                </Box>
                                            </Stack>
                                        </CardContent>
                                    </Card>
                                </Grid>
                            </Grid>
                            <Stack spacing={1} sx={{ mt: 2 }}>
                                <Typography variant="caption" color="textSecondary">
                                    * Required Monthly Payment shows the amount needed to maintain the original payoff date with the new interest rate
                                </Typography>
                                <Typography variant="caption" color="textSecondary">
                                    ** Payoff Date shown assumes current monthly payment is maintained
                                </Typography>
                            </Stack>
                        </Box>
                    </CardContent>
                </Card>
            </Box>
        );
    };

    const PaymentImpactResults = () => {
        const basePayment = extraDebt ? parseFloat(extraDebt.min_payment) : 0;
        const monthlyExtra = frequency === 'monthly' ? extraAmount : extraAmount / 12;
        const totalPayment = basePayment + monthlyExtra;

        const impact = calculateExtraPaymentImpact(
            extraDebt.balance,
            extraDebt.interest_rate,
            basePayment,
            monthlyExtra
        );

        return (
            <Card>
                <CardContent>
                    <Typography variant="h6" gutterBottom>Payment Impact Analysis</Typography>
                    <Stack spacing={2}>
                        <Box>
                            <Typography variant="body2" color="textSecondary">Current Payment</Typography>
                            <Typography variant="h6">{formatCurrency(basePayment)}</Typography>
                        </Box>
                        <Box>
                            <Typography variant="body2" color="textSecondary">New Payment</Typography>
                            <Typography variant="h6" color="primary">
                                {formatCurrency(totalPayment)}
                                <Typography component="span" variant="caption" color="success.main" sx={{ ml: 1 }}>
                                    (+{formatCurrency(monthlyExtra)})
                                </Typography>
                            </Typography>
                        </Box>
                        {impact && (
                            <>
                                <Box>
                                    <Typography variant="body2" color="textSecondary">Time Saved</Typography>
                                    <Typography variant="h6">
                                        {impact.savedMonths > 0 
                                            ? `${impact.savedMonths} months${impact.savedDays > 0 ? ` and ${impact.savedDays} days` : ''}`
                                            : `${impact.savedDays} days`}
                                    </Typography>
                                </Box>
                                <Box>
                                    <Typography variant="body2" color="textSecondary">Interest Saved</Typography>
                                    <Typography variant="h6" color="success.main">
                                        {formatCurrency(impact.originalInterest - impact.modifiedInterest)}
                                    </Typography>
                                </Box>
                                <Box>
                                    <Typography variant="body2" color="textSecondary">Original Payoff Date</Typography>
                                    <Typography variant="h6">
                                        {formatDate(impact.originalDate)}
                                    </Typography>
                                </Box>
                                <Box>
                                    <Typography variant="body2" color="textSecondary">New Payoff Date</Typography>
                                    <Typography variant="h6">
                                        {formatDate(impact.modifiedDate)}
                                    </Typography>
                                </Box>
                            </>
                        )}
                    </Stack>
                </CardContent>
            </Card>
        );
    };

    // What-If Panel
    const handleInterestChange = (value) => {
        const currentRate = Number(scenarioDebt?.interest_rate) || 0;
        const newValue = Math.min(Math.max(Number(value) || 0, -5), 5);
        setInterestChange(Number(newValue.toFixed(2)));
        setNewRateInput((currentRate + newValue).toFixed(2));
    };

    // Update rate change handler
    const handleRateChange = (type, value) => {
        const multiplier = type === 'decrease' ? -1 : 1;
        const change = multiplier * Number(value);
        setInterestChange(change);
        const currentRate = Number(scenarioDebt?.interest_rate) || 0;
        setNewRateInput((currentRate + change).toFixed(2));
    };

    const calculatePaymentForNewRate = (debt, rateChange) => {
        if (!debt || !debt.balance || !debt.interest_rate || !debt.min_payment) {
            return {
                originalPayment: Number(debt.min_payment) || 0,
                newPayment: Number(debt.min_payment) || 0,
                difference: 0
            };
        }

        const requiredPayment = calculateRequiredPayment(
            Number(debt.balance),
            Number(debt.interest_rate),
            Number(debt.interest_rate) + Number(rateChange),
            Number(debt.min_payment)
        );

        return {
            originalPayment: Number(debt.min_payment),
            newPayment: requiredPayment,
            difference: requiredPayment - Number(debt.min_payment)
        };
    };

    const WhatIfPanel = () => (
        <Box sx={{ width: '100%', p: 2 }}>
            <Typography variant="h5" gutterBottom>What-If Interest Rate Scenarios</Typography>
            
            {/* Part 1: Payment Impact Table */}
            <Card sx={{ mb: 4 }}>
                <CardContent sx={{ p: 3 }}>
                    <Typography variant="h6" gutterBottom align="center">Monthly Payment Impact Analysis</Typography>
                    <Box sx={{ width: '100%', maxWidth: 1100, margin: '0 auto' }}>
                        <Stack spacing={3}>  {/* Changed from Grid to Stack */}
                            <Card sx={{ 
                                bgcolor: '#f8f9fa',
                                '& .decrease-col': { bgcolor: '#e8f5e9' },
                                '& .increase-col': { bgcolor: '#fce4ec' }
                            }}>
                                <CardContent>
                                    <Typography variant="h6" color="primary" gutterBottom>
                                        Total Monthly Impact
                                    </Typography>
                                    <TableContainer>
                                        <Table size="medium">
                                            <TableHead>
                                                <TableRow>
                                                    <TableCell width="20%">Current Payment</TableCell>
                                                    <TableCell width="20%" align="right" className="decrease-col">-1.0%</TableCell>
                                                    <TableCell width="20%" align="right" className="decrease-col">-0.5%</TableCell>
                                                    <TableCell width="20%" align="right" className="increase-col">+0.5%</TableCell>
                                                    <TableCell width="20%" align="right" className="increase-col">+1.0%</TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                <TableRow>
                                                    <TableCell>
                                                        {formatCurrency(
                                                            debts
                                                                .filter(d => d && d.min_payment)
                                                                .reduce((sum, debt) => sum + Number(debt.min_payment), 0)
                                                        )}
                                                    </TableCell>
                                                    {[-1, -0.5, 0.5, 1].map(change => {
                                                        const totalOriginal = debts
                                                            .filter(d => d && d.min_payment)
                                                            .reduce((sum, debt) => sum + Number(debt.min_payment), 0);
                                                        const totalNew = debts
                                                            .filter(d => d && d.min_payment && d.balance && d.interest_rate)
                                                            .reduce((sum, debt) => {
                                                                const calc = calculatePaymentForNewRate(debt, change);
                                                                return sum + (calc?.newPayment || Number(debt.min_payment));
                                                            }, 0);
                                                        const difference = totalNew - totalOriginal;
                                                        
                                                        return (
                                                            <TableCell 
                                                                key={change} 
                                                                align="right"
                                                            >
                                                                {formatCurrency(totalNew)}
                                                                <Typography 
                                                                    variant="caption" 
                                                                    display="block"
                                                                    sx={{ 
                                                                        fontWeight: 'bold',
                                                                        color: difference > 0 ? 'error.main' : 'success.main'
                                                                    }}
                                                                >
                                                                    ({difference > 0 ? '+' : ''}{formatCurrency(difference)})
                                                                </Typography>
                                                            </TableCell>
                                                        );
                                                    })}
                                                </TableRow>
                                            </TableBody>
                                        </Table>
                                    </TableContainer>
                                </CardContent>
                            </Card>

                            <Card sx={{ 
                                bgcolor: '#fff3e0',
                                '& .decrease-col': { bgcolor: '#e8f5e9' },
                                '& .increase-col': { bgcolor: '#fce4ec' }
                            }}>
                                <CardContent>
                                    <Typography variant="h6" color="secondary" gutterBottom>
                                        Individual Debt Impact
                                    </Typography>
                                    <TableContainer>
                                        <Table size="medium">
                                            <TableHead>
                                                <TableRow>
                                                    <TableCell width="20%">Debt Name</TableCell>
                                                    <TableCell width="20%" align="right">Current</TableCell>
                                                    <TableCell width="20%" align="right" className="decrease-col">-1.0%</TableCell>
                                                    <TableCell width="20%" align="right" className="decrease-col">-0.5%</TableCell>
                                                    <TableCell width="20%" align="right" className="increase-col">+0.5%</TableCell>
                                                    <TableCell width="20%" align="right" className="increase-col">+1.0%</TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {debts.map(debt => (
                                                    <TableRow key={debt.id}>
                                                        <TableCell>{debt.name}</TableCell>
                                                        <TableCell align="right">{formatCurrency(debt.min_payment)}</TableCell>
                                                        {[-1, -0.5, 0.5, 1].map(change => {
                                                            const calc = calculatePaymentForNewRate(debt, change);
                                                            return (
                                                                <TableCell 
                                                                    key={change} 
                                                                    align="right"
                                                                >
                                                                    {formatCurrency(calc.newPayment)}
                                                                    <Typography 
                                                                        variant="caption" 
                                                                        display="block"
                                                                        sx={{ 
                                                                            fontWeight: 'bold',
                                                                            color: calc.difference > 0 ? 'error.main' : 'success.main'
                                                                        }}
                                                                    >
                                                                        ({calc.difference > 0 ? '+' : ''}{formatCurrency(calc.difference)})
                                                                    </Typography>
                                                                </TableCell>
                                                            );
                                                        })}
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </TableContainer>
                                </CardContent>
                            </Card>
                        </Stack>
                    </Box>
                </CardContent>
            </Card>

            {/* Part 2: Existing Scenario Analysis */}
            <Divider sx={{ my: 4 }} />
            <Typography variant="h6" gutterBottom>Detailed Scenario Analysis</Typography>
            <Grid container spacing={3} sx={{ minHeight: '100px' }}>
                <Grid item xs={12} md={4}>
                    <FormControl fullWidth size="medium" sx={{ minWidth: '200px' }}>
                        <InputLabel>Select Debt</InputLabel>
                        <Select
                            value={scenarioDebt?.id || ''}
                            onChange={(e) => {
                                setScenarioDebt(debts.find(d => d.id === e.target.value));
                                setInterestChange(0);
                            }}
                            label="Select Debt"
                        >
                            {debts.map(debt => (
                                <MenuItem key={debt.id} value={debt.id}>{debt.name}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Grid>
                {scenarioDebt && (
                    <Grid item xs={12} md={8}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>Current Details</Typography>
                                <Grid container spacing={2}>
                                    <Grid item xs={6}>
                                        <Typography>Balance: {formatCurrency(scenarioDebt.balance)}</Typography>
                                    </Grid>
                                    <Grid item xs={6}>
                                        <Typography>Interest Rate: {scenarioDebt.interest_rate}%</Typography>
                                    </Grid>
                                    <Grid item xs={6}>
                                        <Typography>Monthly Payment: {formatCurrency(scenarioDebt.min_payment)}</Typography>
                                    </Grid>
                                    <Grid item xs={6}>
                                        <Typography>Type: {scenarioDebt.type}</Typography>
                                    </Grid>
                                </Grid>
                            </CardContent>
                        </Card>
                    </Grid>
                )}
            </Grid>

            {scenarioDebt && (
                <>
                    <Box sx={{ 
                        mt: 3, 
                        display: 'flex', 
                        justifyContent: 'center' 
                    }}>
                        <Card sx={{ maxWidth: 800, width: '100%' }}>
                            <CardContent sx={{ p: 3 }}>
                                <Typography variant="h6" gutterBottom align="center">Adjust Interest Rate</Typography>
                                <Box sx={{ 
                                    maxWidth: 700, 
                                    width: '100%', 
                                    margin: '0 auto',
                                    display: 'flex', 
                                    flexDirection: 'column', 
                                    gap: 2 
                                }}>
                                    <FormControl fullWidth size="small">
                                        <InputLabel>Change Type</InputLabel>
                                        <Select
                                            value={rateChangeType}
                                            onChange={(e) => {
                                                setRateChangeType(e.target.value);
                                                handleRateChange(e.target.value, interestChange);
                                            }}
                                            label="Change Type"
                                        >
                                            <MenuItem value="increase">Increase</MenuItem>
                                            <MenuItem value="decrease">Decrease</MenuItem>
                                        </Select>
                                    </FormControl>
                                    <FormControl fullWidth size="small">
                                        <InputLabel>Rate Change</InputLabel>
                                        <Select
                                            value={Math.abs(interestChange).toFixed(1)}
                                            onChange={(e) => handleRateChange(rateChangeType, e.target.value)}
                                            label="Rate Change"
                                        >
                                            {rateOptions.map(({ value, label }) => (
                                                <MenuItem key={value} value={value}>
                                                    {label}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </Box>
                            </CardContent>
                        </Card>
                    </Box>

                    <Box sx={{ mt: 3 }}>
                        <ScenarioResults />
                    </Box>
                </>
            )}
        </Box>
    );

    // Extra Payment Panel
    const ExtraPaymentPanel = () => (
        <Box>
            <Typography variant="h5" gutterBottom>Extra Payment Calculator</Typography>
            <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                    <FormControl fullWidth sx={{ mb: 2 }}>
                        <InputLabel>Select Debt</InputLabel>
                        <Select
                            value={extraDebt?.id || ''}
                            onChange={(e) => setExtraDebt(debts.find(d => d.id === e.target.value))}
                            label="Select Debt"
                        >
                            {debts.map(debt => (
                                <MenuItem key={debt.id} value={debt.id}>{debt.name}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    <TextField
                        key={extraAmount}  // Add this line to force re-render with new defaultValue
                        fullWidth
                        type="number"
                        inputProps={{ min: 0 }}
                        label="Extra Payment Amount"
                        defaultValue={extraAmount || ''}  // Change empty string to current value
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                const value = e.target.value;
                                setExtraAmount(value ? Number(value) : 0);
                                e.target.blur();
                            }
                        }}
                        onBlur={(e) => {
                            const value = e.target.value;
                            setExtraAmount(value ? Number(value) : 0);
                        }}
                        sx={{ mb: 2 }}
                    />
                    <FormControl fullWidth>
                        <InputLabel>Payment Frequency</InputLabel>
                        <Select
                            value={frequency}
                            onChange={(e) => setFrequency(e.target.value)}
                            label="Payment Frequency"
                        >
                            <MenuItem value="monthly">Monthly</MenuItem>
                            <MenuItem value="quarterly">Quarterly</MenuItem>
                            <MenuItem value="annually">Annually</MenuItem>
                        </Select>
                    </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                    {extraDebt && extraAmount > 0 && <PaymentImpactResults />}
                </Grid>
            </Grid>
        </Box>
    );

    useEffect(() => {
        if (scenarioDebt) {
            const currentRate = Number(scenarioDebt.interest_rate) || 0;
            setNewRateInput(currentRate.toFixed(2));
            setInterestChange(0.5); // Set default interest change to 0.5
            setRateChangeType('increase'); // Default to increase
        }
    }, [scenarioDebt]);

    const calculateOriginalScenario = (debt) => {
        if (!debt) return null;
        
        let balance = parseFloat(debt.balance);
        let months = 0;
        let totalInterest = 0;
        const monthlyRate = debt.interest_rate / 100 / 12;
        
        while (balance > 0 && months < 600) {
            const monthlyInterest = balance * monthlyRate;
            totalInterest += monthlyInterest;
            balance = balance + monthlyInterest - debt.min_payment;
            months++;
        }
        
        return {
            months,
            totalInterest,
            projectedPayoffDate: new Date(Date.now() + (months * 30.44 * 24 * 60 * 60 * 1000))
        };
    };

    // Add this test function
    const testPayoffCalculation = () => {
        const result = calculatePayoffDateAndInterest(750, 25, 150);
        console.log('Months to payoff:', result.months);
        console.log('Total interest:', result.totalInterest.toFixed(2));
        console.log('Payoff date:', result.payoffDate.toLocaleDateString());
    };

    return (
        <Box sx={{ maxWidth: 1200, margin: '0 auto', p: 3 }}>
            <Typography variant="h4" gutterBottom align="center">
                Debt Insights
            </Typography>
            
            <Tabs value={currentTab} onChange={(e, v) => setCurrentTab(v)} centered sx={{ mb: 3 }}>
                <Tab label="What-If Scenarios" />
                <Tab label="Extra Payment Calculator" />
            </Tabs>

            {currentTab === 0 && <WhatIfPanel />}
            {currentTab === 1 && <ExtraPaymentPanel />}

            <Box sx={{ mt: 3, textAlign: 'center' }}>
                <Link to="/debt-management" style={{ textDecoration: 'none' }}>
                    <Button
                        variant="outlined"
                        color="primary"
                        sx={{ mt: 2 }}
                    >
                        Back to Debt Management
                    </Button>
                </Link>
            </Box>
        </Box>
    );
};

export default DebtInsights;
