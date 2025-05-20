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

// Register ChartJS components
ChartJS.register(
    CategoryScale, LinearScale, PointElement, LineElement,
    BarElement, ArcElement, Title, Tooltip, Legend
);

const DebtInsights = () => {
    const [currentTab, setCurrentTab] = useState(0);
    const [debts, setDebts] = useState([]);
    const [selectedDebt1, setSelectedDebt1] = useState(null);
    const [selectedDebt2, setSelectedDebt2] = useState(null);
    // What-if scenario states
    const [scenarioDebt, setScenarioDebt] = useState(null);
    const [interestChange, setInterestChange] = useState(0);
    const [paymentChange, setPaymentChange] = useState(0);
    // Extra payment states
    const [extraDebt, setExtraDebt] = useState(null);
    const [extraAmount, setExtraAmount] = useState(0);
    const [frequency, setFrequency] = useState('monthly');

    // New states for enhanced features
    const [paymentStrategy, setPaymentStrategy] = useState('avalanche');
    const [extraMonthlyPayment, setExtraMonthlyPayment] = useState(0);
    const [inflationRate, setInflationRate] = useState(2);
    const [payoffGoalDate, setPayoffGoalDate] = useState(null);

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
        const newPayment = parseFloat(scenarioDebt.min_payment) + paymentChange;
        
        let balance = parseFloat(scenarioDebt.balance);
        let months = 0;
        let totalInterest = 0;
        
        while (balance > 0 && months < 600) {
            const monthlyInterest = (balance * (newInterestRate / 100)) / 12;
            totalInterest += monthlyInterest;
            balance = balance + monthlyInterest - newPayment;
            months++;
        }
        
        return {
            months,
            totalInterest,
            monthlySavings: scenarioDebt.min_payment - newPayment,
            totalSavings: (scenarioDebt.min_payment * months) - (newPayment * months)
        };
    };

    const calculateExtraPaymentImpact = () => {
        if (!extraDebt || !extraAmount) return null;
        
        const basePayment = parseFloat(extraDebt.min_payment);
        const monthlyExtra = frequency === 'monthly' ? extraAmount : extraAmount / 12;
        const totalPayment = basePayment + monthlyExtra;
        
        let balanceWithExtra = parseFloat(extraDebt.balance);
        let balanceNormal = parseFloat(extraDebt.balance);
        let months = 0;
        
        // Calculate both scenarios
        while (balanceWithExtra > 0 && months < 600) {
            const monthlyInterest = (balanceWithExtra * (extraDebt.interest_rate / 100)) / 12;
            balanceWithExtra = balanceWithExtra + monthlyInterest - totalPayment;
            balanceNormal = balanceNormal + monthlyInterest - basePayment;
            months++;
        }
        
        return {
            monthsSaved: months,
            interestSaved: balanceNormal - balanceWithExtra,
            newPayoffDate: new Date(Date.now() + (months * 30.44 * 24 * 60 * 60 * 1000))
        };
    };

    useEffect(() => {
        const fetchDebts = async () => {
            try {
                const response = await fetch('/api/debts', {
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    },
                    credentials: 'include'
                });
                
                if (!response.ok) {
                    throw new Error('Failed to fetch debts');
                }
                
                const data = await response.json();
                setDebts(data);
            } catch (error) {
                console.error('Error fetching debts:', error);
            }
        };

        fetchDebts();
    }, []);

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

    // Helper Components
    const ComparisonTable = () => (
        <TableContainer component={Paper}>
            <Table>
                <TableHead>
                    <TableRow>
                        <TableCell>Metric</TableCell>
                        <TableCell>{selectedDebt1.name}</TableCell>
                        <TableCell>{selectedDebt2.name}</TableCell>
                        <TableCell>Comparison</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    <TableRow>
                        <TableCell>Balance</TableCell>
                        <TableCell>{formatCurrency(selectedDebt1.balance)}</TableCell>
                        <TableCell>{formatCurrency(selectedDebt2.balance)}</TableCell>
                        <TableCell>
                            {`Difference: ${formatCurrency(Math.abs(selectedDebt1.balance - selectedDebt2.balance))}`}
                        </TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell>Interest Rate</TableCell>
                        <TableCell>{selectedDebt1.interest_rate}%</TableCell>
                        <TableCell>{selectedDebt2.interest_rate}%</TableCell>
                        <TableCell>
                            {`${Math.abs(selectedDebt1.interest_rate - selectedDebt2.interest_rate).toFixed(2)}% difference`}
                        </TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell>Monthly Payment</TableCell>
                        <TableCell>{formatCurrency(selectedDebt1.min_payment)}</TableCell>
                        <TableCell>{formatCurrency(selectedDebt2.min_payment)}</TableCell>
                        <TableCell>
                            {`Difference: ${formatCurrency(Math.abs(selectedDebt1.min_payment - selectedDebt2.min_payment))}`}
                        </TableCell>
                    </TableRow>
                </TableBody>
            </Table>
        </TableContainer>
    );

    const ScenarioResults = () => {
        const result = calculateWhatIfScenario();
        return (
            <Card>
                <CardContent>
                    <Typography variant="h6" gutterBottom>Scenario Results</Typography>
                    <Grid container spacing={2}>
                        <Grid item xs={12}>
                            <Typography>
                                New Monthly Payment: {formatCurrency(scenarioDebt.min_payment + paymentChange)}
                            </Typography>
                        </Grid>
                        <Grid item xs={12}>
                            <Typography>
                                New Interest Rate: {(parseFloat(scenarioDebt.interest_rate) + interestChange).toFixed(2)}%
                            </Typography>
                        </Grid>
                        {result && (
                            <>
                                <Grid item xs={12}>
                                    <Typography>
                                        Time to Pay Off: {result.months} months
                                    </Typography>
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography>
                                        Total Interest: {formatCurrency(result.totalInterest)}
                                    </Typography>
                                </Grid>
                            </>
                        )}
                    </Grid>
                </CardContent>
            </Card>
        );
    };

    const PaymentImpactResults = () => {
        const impact = calculateExtraPaymentImpact();
        return (
            <Card>
                <CardContent>
                    <Typography variant="h6" gutterBottom>Payment Impact Analysis</Typography>
                    {impact && (
                        <Grid container spacing={2}>
                            <Grid item xs={12}>
                                <Typography>
                                    Time Saved: {impact.monthsSaved} months
                                </Typography>
                            </Grid>
                            <Grid item xs={12}>
                                <Typography>
                                    Interest Saved: {formatCurrency(impact.interestSaved)}
                                </Typography>
                            </Grid>
                            <Grid item xs={12}>
                                <Typography>
                                    New Payoff Date: {formatDate(impact.newPayoffDate)}
                                </Typography>
                            </Grid>
                        </Grid>
                    )}
                </CardContent>
            </Card>
        );
    };

    // Comparison Tab Panel
    const ComparisonPanel = () => (
        <Box>
            <Typography variant="h5" gutterBottom>Compare Debts</Typography>
            <Grid container spacing={2} sx={{ mb: 4 }}>
                <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                        <InputLabel>First Debt</InputLabel>
                        <Select
                            value={selectedDebt1?.id || ''}
                            onChange={(e) => setSelectedDebt1(debts.find(d => d.id === e.target.value))}
                            label="First Debt"
                        >
                            {debts.map(debt => (
                                <MenuItem key={debt.id} value={debt.id}>{debt.name}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                        <InputLabel>Second Debt</InputLabel>
                        <Select
                            value={selectedDebt2?.id || ''}
                            onChange={(e) => setSelectedDebt2(debts.find(d => d.id === e.target.value))}
                            label="Second Debt"
                        >
                            {debts.map(debt => (
                                <MenuItem key={debt.id} value={debt.id}>{debt.name}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Grid>
            </Grid>
            {selectedDebt1 && selectedDebt2 && <ComparisonTable />}
        </Box>
    );

    // What-If Panel
    const handleInterestChange = (value) => {
        const newValue = typeof value === 'number' 
            ? Math.min(Math.max(value, -5), 5)
            : 0;
        setInterestChange(Number(newValue.toFixed(2)));
    };

    const handlePaymentChange = (value) => {
        const maxPayment = scenarioDebt ? Math.max(1000, scenarioDebt.min_payment) : 1000;
        const newValue = typeof value === 'number'
            ? Math.min(Math.max(value, 0), maxPayment)
            : 0;
        setPaymentChange(Number(newValue.toFixed(2)));
    };

    const WhatIfPanel = () => (
        <Box>
            <Typography variant="h5" gutterBottom>What-If Scenarios</Typography>
            <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                    <FormControl fullWidth>
                        <InputLabel>Select Debt</InputLabel>
                        <Select
                            value={scenarioDebt?.id || ''}
                            onChange={(e) => {
                                setScenarioDebt(debts.find(d => d.id === e.target.value));
                                setInterestChange(0);
                                setPaymentChange(0);
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
                    <Box sx={{ mt: 3 }}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>Adjust Parameters</Typography>
                                <Grid container spacing={3}>
                                    <Grid item xs={12} md={6}>
                                        <Typography gutterBottom>Interest Rate Change</Typography>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                                            <TextField
                                                type="number"
                                                label="New Rate"
                                                value={(Number(scenarioDebt.interest_rate) + Number(interestChange)).toFixed(2)}
                                                onChange={(e) => {
                                                    const newRate = Number(e.target.value);
                                                    if (!isNaN(newRate)) {
                                                        const change = newRate - Number(scenarioDebt.interest_rate);
                                                        handleInterestChange(change);
                                                    }
                                                }}
                                                InputProps={{
                                                    endAdornment: '%',
                                                    inputProps: { 
                                                        step: "0.5",
                                                        min: Number(scenarioDebt.interest_rate) - 5,
                                                        max: Number(scenarioDebt.interest_rate) + 5
                                                    }
                                                }}
                                                size="small"
                                            />
                                            <Button
                                                variant="outlined"
                                                onClick={() => handleInterestChange(interestChange - 0.5)}
                                                size="small"
                                            >
                                                <RemoveIcon />
                                            </Button>
                                            <Button
                                                variant="outlined"
                                                onClick={() => handleInterestChange(interestChange + 0.5)}
                                                size="small"
                                            >
                                                <AddIcon />
                                            </Button>
                                        </Box>
                                    </Grid>
                                    <Grid item xs={12} md={6}>
                                        <Typography gutterBottom>Payment Adjustment</Typography>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                            <TextField
                                                type="number"
                                                label="New Payment"
                                                value={(Number(scenarioDebt.min_payment) + Number(paymentChange)).toFixed(2)}
                                                onChange={(e) => {
                                                    const newPayment = Number(e.target.value);
                                                    if (!isNaN(newPayment)) {
                                                        const change = newPayment - Number(scenarioDebt.min_payment);
                                                        handlePaymentChange(change);
                                                    }
                                                }}
                                                InputProps={{
                                                    inputProps: { 
                                                        step: "1",
                                                        min: Number(scenarioDebt.min_payment)
                                                    }
                                                }}
                                                size="small"
                                            />
                                            <Button
                                                variant="outlined"
                                                onClick={() => handlePaymentChange(paymentChange - 1)}
                                                size="small"
                                            >
                                                <RemoveIcon />
                                            </Button>
                                            <Button
                                                variant="outlined"
                                                onClick={() => handlePaymentChange(paymentChange + 1)}
                                                size="small"
                                            >
                                                <AddIcon />
                                            </Button>
                                        </Box>
                                    </Grid>
                                </Grid>
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
                        fullWidth
                        type="number"
                        label="Extra Payment Amount"
                        value={extraAmount}
                        onChange={(e) => setExtraAmount(parseFloat(e.target.value) || 0)}
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

    return (
        <Box sx={{ maxWidth: 1200, margin: '0 auto', p: 3 }}>
            <Typography variant="h4" gutterBottom align="center">
                Debt Insights
            </Typography>
            
            <Tabs value={currentTab} onChange={(e, v) => setCurrentTab(v)} centered sx={{ mb: 3 }}>
                <Tab label="Compare Debts" />
                <Tab label="What-If Scenarios" />
                <Tab label="Extra Payment Calculator" />
            </Tabs>

            {currentTab === 0 && <ComparisonPanel />}
            {currentTab === 1 && <WhatIfPanel />}
            {currentTab === 2 && <ExtraPaymentPanel />}
        </Box>
    );
};

export default DebtInsights;
