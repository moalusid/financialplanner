import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Typography, Card, CardContent, LinearProgress, Button, Box, 
  Grid, Divider, Stack
} from '@mui/material';
import { Add } from '@mui/icons-material';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { 
  Chart, ArcElement, CategoryScale, LinearScale, BarElement, 
  Title
} from 'chart.js';

// Register Chart.js components
Chart.register(ArcElement, CategoryScale, LinearScale, BarElement, Title);

const DebtManagement = () => {
    // Remove currentTab state and handleTabChange
    const [debts, setDebts] = useState([]);
    const [filteredDebts, setFilteredDebts] = useState([]);
    const [totalOutstandingDebt, setTotalOutstandingDebt] = useState(0);
    const [totalOriginalDebt, setTotalOriginalDebt] = useState(0);
    const [totalMonthlyPayments, setTotalMonthlyPayments] = useState(0);
    const [averageInterestRate, setAverageInterestRate] = useState(0);
    const [totalInterestPaid, setTotalInterestPaid] = useState(0);
    const [debtToIncomeRatio, setDebtToIncomeRatio] = useState(0);
    const [sortField, setSortField] = useState('balance');
    const [sortDirection, setSortDirection] = useState('desc');
    const [filterType, setFilterType] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [monthlyIncome, setMonthlyIncome] = useState(0);
    const [projectedPayoffDate, setProjectedPayoffDate] = useState(null);
    
    const navigate = useNavigate();

    // Copy all helper functions from newdash.js
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

    // Add new helper functions
    const calculateProgressPercentage = () => {
        if (totalOriginalDebt === 0) return 0;
        return ((totalOriginalDebt - totalOutstandingDebt) / totalOriginalDebt) * 100;
    };

    const calculateProjectedPayoffDate = () => {
        console.log('Calculating projected payoff with:', {
            debtsExist: debts.length > 0,
            payments: totalMonthlyPayments,
            debt: totalOutstandingDebt,
            rate: averageInterestRate
        });

        if (!totalMonthlyPayments || !totalOutstandingDebt || !averageInterestRate) {
            console.log('Missing required values for payoff calculation');
            return null;
        }

        const averageMonthlyRate = averageInterestRate / 100 / 12;
        let balance = totalOutstandingDebt;
        let months = 0;

        while (balance > 0 && months < 600) {
            const interest = balance * averageMonthlyRate;
            const newBalance = balance + interest - totalMonthlyPayments;
            
            if (newBalance >= balance) {
                return null;
            }
            
            balance = newBalance;
            months++;
        }
        
        if (months >= 600) return null;
        
        const today = new Date();
        const futureDate = new Date(today);
        futureDate.setMonth(today.getMonth() + months);
        
        return futureDate;
    };

    // Add chart data preparation functions
    const prepareDoughnutData = () => {
        const data = debts.reduce((result, debt) => {
            const category = debt.category || 'Other';
            if (!result[category]) {
                result[category] = 0;
            }
            result[category] += parseFloat(debt.balance) || 0;
            return result;
        }, {});

        const COLORS = {
            'Personal Loan': '#FF9800',
            'Credit Card': '#F44336',
            'Mortgage': '#2196F3',
            'Auto Loan': '#4CAF50',
            'Cash Loan': '#9C27B0',
            'Hire Purchase': '#FF5722',
            'Store Card': '#795548',
            'Other': '#607D8B'
        };

        const chartData = Object.entries(data).map(([name, value]) => ({
            name,
            value,
            fill: COLORS[name] || COLORS['Other']
        }));

        return chartData;
    };

    const prepareBalanceHistoryData = () => {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
        return {
            labels: months,
            datasets: [{
                label: 'Total Debt Balance',
                data: [
                    totalOutstandingDebt * 1.1,
                    totalOutstandingDebt * 1.08,
                    totalOutstandingDebt * 1.05,
                    totalOutstandingDebt * 1.03,
                    totalOutstandingDebt * 1.01,
                    totalOutstandingDebt
                ],
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 2
            }]
        };
    };

    // Add health score calculation
    const calculateDebtHealthScore = () => {
        const dti = totalMonthlyPayments && monthlyIncome ? 
            (totalMonthlyPayments / monthlyIncome) * 100 : 0;
        
        if (dti === 0) return 'N/A';
        if (dti <= 15) return 'Excellent';
        if (dti <= 30) return 'Good';
        if (dti <= 40) return 'Fair';
        return 'Poor';
    };

    const calculateAmortisationScenarios = (debt, method = 'avalanche') => {
        const scenarios = [];

        // Base scenario: current min payment
        scenarios.push({
            label: 'Base (Min Payment)',
            monthlyPayment: debt.min_payment,
        });

        // Scenario increases
        const increments = [0.1, 0.2, 0.5];

        if (method === 'avalanche') {
            increments.forEach(inc => {
                scenarios.push({
                    label: `Min + ${inc * 100}%`,
                    monthlyPayment: debt.min_payment * (1 + inc),
                });
            });
        } else if (method === 'snowball') {
            increments.forEach(inc => {
                scenarios.push({
                    label: `Min + ${inc * 100}% of Balance`,
                    monthlyPayment: debt.min_payment + (debt.balance * inc),
                });
            });
        }

        const results = scenarios.map(({ label, monthlyPayment }) => {
            let balance = debt.balance;
            let totalInterest = 0;
            let months = 0;
            let lastPrincipalPayment = 0;

            const monthlyRate = debt.interest_rate / 12 / 100;

            while (balance > 0) {
                const interest = balance * monthlyRate;
                totalInterest += interest;
                let principalPayment = monthlyPayment - interest;
                lastPrincipalPayment = principalPayment;

                if (principalPayment <= 0) {
                    return {
                        scenario: label,
                        months: null,
                        days: null,
                        totalInterest: null,
                        error: 'Payment too low to cover interest',
                    };
                }

                balance -= principalPayment;
                months++;
            }

            // Calculate days based on last payment
            const overpayment = Math.abs(balance);
            let days = 0;
            if (months > 0 && lastPrincipalPayment > 0) {
                const dailyRate = monthlyPayment / 30.44;
                const paymentUsed = monthlyPayment - overpayment;
                days = Math.ceil(paymentUsed / dailyRate);
            }
            const displayMonths = months - 1;

            return {
                scenario: label,
                months: displayMonths,
                days: days,
                totalInterest: totalInterest.toFixed(2),
                error: null,
            };
        });

        return results;
    };

    const filterAndSortDebts = (debts, type, field, direction, search) => {
        let filtered = [...debts];
        
        // Apply type filter
        if (type !== 'all') {
            filtered = filtered.filter(debt => 
                debt.type?.toLowerCase() === type.toLowerCase()
            );
        }
        
        // Apply search
        if (search.trim()) {
            const searchLower = search.toLowerCase();
            filtered = filtered.filter(debt => 
                debt.name?.toLowerCase().includes(searchLower)
            );
        }
        
        // Apply sorting
        filtered.sort((a, b) => {
            let aValue = parseFloat(a[field]) || 0;
            let bValue = parseFloat(b[field]) || 0;
            
            if (field === 'name') {
                aValue = a.name || '';
                bValue = b.name || '';
                return direction === 'asc' 
                    ? aValue.localeCompare(bValue)
                    : bValue.localeCompare(aValue);
            }
            
            return direction === 'asc' ? aValue - bValue : bValue - aValue;
        });
        
        return filtered;
    };

    const fetchMonthlyIncome = async () => {
        const now = new Date();
        // Get current year and month (1-12)
        const date = new Date();
        const year = date.getFullYear();
        const month = date.getMonth() + 1; // getMonth() returns 0-11

        console.log(`Fetching income for ${year}-${month}`);
        
        try {
            const response = await fetch(`/api/transactions/monthly-income/${year}/${month}`, {
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                credentials: 'include'  // Add credentials for session handling
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('Response not ok:', errorText); // Debug log
                throw new Error('Failed to fetch monthly income');
            }
            
            const data = await response.json();
            console.log('Received income data:', data); // Debug log
            setMonthlyIncome(data.totalIncome || 0);
        } catch (error) {
            console.error('Error fetching monthly income:', error);
            setMonthlyIncome(0);
        }
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

                // Calculate all summary values first
                const totalDebt = data.reduce((sum, debt) => sum + (parseFloat(debt.balance) || 0), 0);
                const totalOriginal = data.reduce((sum, debt) => sum + (parseFloat(debt.original_amount) || 0), 0);
                const totalMonthly = data.reduce((sum, debt) => sum + (parseFloat(debt.min_payment) || 0), 0);
                const avgInterestRate = data.length > 0
                    ? data.reduce((sum, debt) => sum + (parseFloat(debt.interest_rate) || 0), 0) / data.length
                    : 0;

                // Calculate total interest including current month's accrual
                const totalInterest = data.reduce((sum, debt) => {
                    const monthlyRate = (parseFloat(debt.interest_rate) || 0) / 100 / 12;
                    const currentMonthInterest = (parseFloat(debt.balance) || 0) * monthlyRate;
                    return sum + (parseFloat(debt.interest_paid) || 0) + currentMonthInterest;
                }, 0);

                // Set all basic stats
                setTotalOutstandingDebt(totalDebt);
                setTotalOriginalDebt(totalOriginal);
                setTotalMonthlyPayments(totalMonthly);
                setAverageInterestRate(avgInterestRate);
                setTotalInterestPaid(totalInterest);
                
                // Remove this line since we have a separate effect
                // setProjectedPayoffDate(calculateProjectedPayoffDate());

                // Filter debts last
                const filtered = filterAndSortDebts(data, filterType, sortField, sortDirection, searchTerm);
                setFilteredDebts(filtered);

                // Fetch income and update DTI separately
                await fetchMonthlyIncome();
            } catch (error) {
                console.error('Error:', error);
            }
        };

        fetchDebts();
    }, [filterType, sortField, sortDirection, searchTerm]);

    // Separate effect for DTI updates when monthly income changes
    useEffect(() => {
        if (totalMonthlyPayments && monthlyIncome) {
            const dti = monthlyIncome > 0 
                ? (totalMonthlyPayments / monthlyIncome) * 100 
                : 0;
            setDebtToIncomeRatio(dti);
        }
    }, [monthlyIncome, totalMonthlyPayments]);

    // Add effect to refresh monthly income at start of new month
    useEffect(() => {
        const timer = setInterval(() => {
            const now = new Date();
            if (now.getDate() === 1 && now.getHours() === 0) {
                fetchMonthlyIncome();
            }
        }, 1000 * 60 * 60); // Check every hour

        return () => clearInterval(timer);
    }, []);

    // Add new effect to fetch monthly income on component mount
    useEffect(() => {
        fetchMonthlyIncome();
    }, []);

    useEffect(() => {
        if (debts.length > 0 && totalMonthlyPayments && totalOutstandingDebt && averageInterestRate) {
            const newDate = calculateProjectedPayoffDate();
            console.log('Setting new projected date:', newDate);
            setProjectedPayoffDate(newDate);
        }
    }, [debts, totalOutstandingDebt, totalMonthlyPayments, averageInterestRate]);

    // Add new event handlers
    const toggleSortDirection = () => {
        setSortDirection(prevDirection => prevDirection === 'asc' ? 'desc' : 'asc');
    };

    const handleFilterChange = (e) => {
        setFilterType(e.target.value);
    };

    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
    };

    const handleTileClick = (debtId) => {
        navigate(`/debt-details/${debtId}`);
    };

    const calculateIndividualProgress = (debt) => {
        if (debt.type === 'revolving') {
            return (1 - (debt.balance / (debt.debt_limit || 1))) * 100;
        }
        return ((debt.original_amount - debt.balance) / (debt.original_amount || 1)) * 100;
    };

    // Copy remaining event handlers from newdash.js
    // ...implementation...

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px', fontFamily: 'Open Sans, sans-serif' }}>
            <Box sx={{ flexGrow: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                    <Typography variant="h4">
                        Debt Management Dashboard
                    </Typography>
                </Box>
                <Grid container spacing={3}>
                    <Grid item xs={12} sm={6} md={3}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" color="textSecondary">
                                    Total Outstanding Debt
                                </Typography>
                                <Typography variant="h5" color="textPrimary">
                                    {formatCurrency(totalOutstandingDebt)}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" color="textSecondary">
                                    Total Original Debt
                                </Typography>
                                <Typography variant="h5" color="textPrimary">
                                    {formatCurrency(totalOriginalDebt)}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" color="textSecondary">
                                    Total Monthly Payments
                                </Typography>
                                <Typography variant="h5" color="textPrimary">
                                    {formatCurrency(totalMonthlyPayments)}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" color="textSecondary">
                                    Average Interest Rate
                                </Typography>
                                <Typography variant="h5" color="textPrimary">
                                    {averageInterestRate.toFixed(2)}%
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" color="textSecondary">
                                    Total Interest Paid
                                </Typography>
                                <Typography variant="h5" color="textPrimary">
                                    {formatCurrency(totalInterestPaid)}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" color="textSecondary">
                                    Debt-to-Income Ratio
                                </Typography>
                                <Typography variant="h5" color="textPrimary">
                                    {debtToIncomeRatio.toFixed(2)}%
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" color="textSecondary">
                                    Projected Payoff Date
                                </Typography>
                                <Typography variant="h5" color="textPrimary">
                                    {projectedPayoffDate ? formatDate(projectedPayoffDate) : 'N/A'}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" color="textSecondary">
                                    Debt Health Score
                                </Typography>
                                <Typography variant="h5" color="textPrimary">
                                    {calculateDebtHealthScore()}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>

                {/* Add button box */}
                <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, my: 4 }}>
                    <Button
                        variant="contained"
                        color="primary"
                        component={Link}
                        to="/debt-insights"
                    >
                        View Debt Insights
                    </Button>
                    <Button
                        variant="contained"
                        color="primary"
                        component={Link}
                        to="/debt-list"
                    >
                        View All Debts
                    </Button>
                    <Button
                        variant="contained"
                        color="primary"
                        startIcon={<Add />}
                        component={Link}
                        to="/add-debt-type"
                    >
                        Add New Debt
                    </Button>
                </Box>

                <Divider sx={{ my: 4 }} />

                {/* Single Grid for Donut Chart */}
                <Grid container justifyContent="center">
                    <Grid item xs={12} md={8}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" color="textSecondary" gutterBottom>
                                    Debt Distribution by Category
                                </Typography>
                                <ResponsiveContainer width="100%" height={400}>
                                    <PieChart>
                                        <Pie
                                            data={prepareDoughnutData()}
                                            dataKey="value"
                                            nameKey="name"
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={120}
                                            label={({name, value}) => `${name}: P${value.toLocaleString('en-BW')}`}
                                        >
                                            {prepareDoughnutData().map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.fill} />
                                            ))}
                                        </Pie>
                                        <Tooltip 
                                            formatter={(value) => `P${value.toLocaleString('en-BW')}`}
                                        />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>

                {/* Analysis Section */}
                <Box sx={{ mt: 4, p: 3, bgcolor: '#f8f9fa', borderRadius: 2 }}>
                    <Typography variant="h5" color="textPrimary" gutterBottom>
                        Debt Reduction Analysis
                    </Typography>
                    <Typography variant="body1" color="textSecondary" gutterBottom>
                        To reduce your debt effectively, consider the following strategies:
                    </Typography>
                    <ul>
                        <li>
                            <Typography variant="body1" color="textPrimary">
                                <strong>Avalanche Method:</strong> Focus on paying off debts with the highest interest rates first while making minimum payments on others. This minimizes the total interest paid over time.
                            </Typography>
                        </li>
                        <li>
                            <Typography variant="body1" color="textPrimary">
                                <strong>Snowball Method:</strong> Focus on paying off the smallest debts first to build momentum and motivation, while making minimum payments on larger debts.
                            </Typography>
                        </li>
                    </ul>
                    <Typography variant="body1" color="textSecondary" gutterBottom>
                        Based on your current debts:
                    </Typography>
                    <ul>
                        <li>
                            <Typography variant="body1" color="textPrimary">
                                <strong>Highest Interest Rate Debt:</strong> {debts.length > 0 ? debts.reduce((prev, curr) => (parseFloat(prev.interest_rate) > parseFloat(curr.interest_rate) ? prev : curr)).name : 'N/A'}
                            </Typography>
                            {debts.length > 0 && (() => {
                                const highestInterestDebt = debts.reduce((prev, curr) => (parseFloat(prev.interest_rate) > parseFloat(curr.interest_rate) ? prev : curr));
                                const scenarios = calculateAmortisationScenarios(highestInterestDebt, 'avalanche');
                                const base = scenarios[0];
                                return (
                                    <ul>
                                        {scenarios.map(({ scenario, months, days, totalInterest, error }, idx) => {
                                            let extraInfo = '';
                                            if (!error && idx > 0 && base.months !== null && base.days !== null) {
                                                // Calculate days difference
                                                const baseTotalDays = base.months * 30.44 + base.days;
                                                const scenarioTotalDays = months * 30.44 + days;
                                                const daysSaved = Math.round(baseTotalDays - scenarioTotalDays);

                                                // Calculate interest difference
                                                const interestSaved = (parseFloat(base.totalInterest) - parseFloat(totalInterest)).toFixed(2);

                                                extraInfo = ` Save yourself ${daysSaved} days and ${interestSaved} interest.`;
                                            }
                                            return (
                                                <li key={scenario}>
                                                    <Typography variant="body2" color="textSecondary">
                                                        {scenario}: {error ? error : `Payoff in ${months} months and ${days} days, total interest: ${totalInterest}${extraInfo}`}
                                                    </Typography>
                                                </li>
                                            );
                                        })}
                                    </ul>
                                );
                            })()}
                        </li>
                        <li>
                            <Typography variant="body1" color="textPrimary">
                                <strong>Smallest Debt Balance:</strong> {debts.length > 0 ? debts.reduce((prev, curr) => (parseFloat(prev.balance) < parseFloat(curr.balance) ? prev : curr)).name : 'N/A'}
                            </Typography>
                            {debts.length > 0 && (() => {
                                const smallestDebt = debts.reduce((prev, curr) => (parseFloat(prev.balance) < parseFloat(curr.balance) ? prev : curr));
                                // Recalculate scenarios using the current balance for each scenario
                                const baseBalance = parseFloat(smallestDebt.balance);
                                const baseMinPayment = parseFloat(smallestDebt.min_payment);
                                const baseInterestRate = parseFloat(smallestDebt.interest_rate);

                                // Build scenarios using the correct balance for each scenario
                                const increments = [0, 0.1, 0.2, 0.5];
                                const scenarios = increments.map((inc, idx) => {
                                    let label, monthlyPayment;
                                    if (idx === 0) {
                                        label = 'Base (Min Payment)';
                                        monthlyPayment = baseMinPayment;
                                    } else {
                                        label = `Min + ${inc * 100}% of Balance`;
                                        monthlyPayment = baseMinPayment + (baseBalance * inc);
                                    }

                                    let balance = baseBalance;
                                    let totalInterest = 0;
                                    let months = 0;
                                    let lastPrincipalPayment = 0;

                                    const monthlyRate = baseInterestRate / 12 / 100;

                                    while (balance > 0) {
                                        const interest = balance * monthlyRate;
                                        totalInterest += interest;
                                        let principalPayment = monthlyPayment - interest;
                                        lastPrincipalPayment = principalPayment;

                                        if (principalPayment <= 0) {
                                            return {
                                                scenario: label,
                                                months: null,
                                                days: null,
                                                totalInterest: null,
                                                error: 'Payment too low to cover interest',
                                            };
                                        }

                                        balance -= principalPayment;
                                        months++;
                                    }

                                    const overpayment = Math.abs(balance);
                                    let days = 0;
                                    if (months > 0 && lastPrincipalPayment > 0) {
                                        const dailyRate = monthlyPayment / 30.44;
                                        const paymentUsed = monthlyPayment - overpayment;
                                        days = Math.ceil(paymentUsed / dailyRate);
                                    }
                                    const displayMonths = months - 1;

                                    return {
                                        scenario: label,
                                        months: displayMonths,
                                        days: days,
                                        totalInterest: totalInterest.toFixed(2),
                                        error: null,
                                    };
                                });

                                const base = scenarios[0];
                                return (
                                    <ul>
                                        {scenarios.map(({ scenario, months, days, totalInterest, error }, idx) => {
                                            let extraInfo = '';
                                            if (!error && idx > 0 && base.months !== null && base.days !== null) {
                                                const baseTotalDays = base.months * 30.44 + base.days;
                                                const scenarioTotalDays = months * 30.44 + days;
                                                const daysSaved = Math.round(baseTotalDays - scenarioTotalDays);
                                                const interestSaved = (parseFloat(base.totalInterest) - parseFloat(totalInterest)).toFixed(2);
                                                extraInfo = ` Save yourself ${daysSaved} days and ${interestSaved} interest.`;
                                            }
                                            return (
                                                <li key={scenario}>
                                                    <Typography variant="body2" color="textSecondary">
                                                        {scenario}: {error ? error : `Payoff in ${months} months and ${days} days, total interest: ${totalInterest}${extraInfo}`}
                                                    </Typography>
                                                </li>
                                            );
                                        })}
                                    </ul>
                                );
                            })()}
                        </li>
                    </ul>
                    <Typography variant="body1" color="textSecondary" style={{ marginTop: '20px' }}>
                        Choose a method that aligns with your financial goals and discipline. Remember to revisit your budget regularly to allocate extra funds toward debt repayment.
                    </Typography>
                </Box>

                {/* Planned Expenses Section - To be implemented */}
                <Box sx={{ mt: 4 }}>
                    <Typography variant="h5" color="textPrimary" gutterBottom>
                        Planned Expenses
                    </Typography>
                    <Typography variant="body1" color="textSecondary" gutterBottom>
                        Manage your upcoming expenses to maintain a healthy budget:
                    </Typography>
                    {/* Table or list of planned expenses */}
                </Box>

                {/* Navigation buttons - if needed */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
                    <Button
                        variant="contained"
                        color="primary"
                        component={Link}
                        to="/previous-page"
                    >
                        Back
                    </Button>
                    <Button
                        variant="contained"
                        color="primary"
                        component={Link}
                        to="/next-page"
                    >
                        Next
                    </Button>
                </Box>
            </Box>
        </div>
    );
};

export default DebtManagement;