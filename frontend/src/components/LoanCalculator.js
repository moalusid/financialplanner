import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { 
  Slider, Typography, Box, Grid, Card, CardContent, 
  FormControl, InputLabel, Select, MenuItem, Divider,
  Stack, Tab, Tabs, Button 
} from '@mui/material';
import { Chart } from 'react-google-charts';

const LoanCalculator = () => {
  const [currentTab, setCurrentTab] = useState(0);
  const [loan, setLoan] = useState({ amount: 5000, rate: 5, months: 12 });
  const [monthly, setMonthly] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [banks, setBanks] = useState([]);
  const [loanProducts, setLoanProducts] = useState([]);
  const [selectedBank, setSelectedBank] = useState(null);
  const [comparison, setComparison] = useState([]);

  useEffect(() => {
    const fetchBankData = async () => {
      try {
        const [banksRes, productsRes] = await Promise.all([
          axios.get(`${apiUrl}/calculator/banks`),
          axios.get(`${apiUrl}/calculator/loan-products`)
        ]);
        setBanks(banksRes.data);
        setLoanProducts(productsRes.data);
      } catch (error) {
        console.error('Error fetching bank data:', error);
      }
    };
    fetchBankData();
  }, []);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-BW', {
      style: 'currency',
      currency: 'BWP',
    }).format(amount);
  };

  const handleCalculate = async () => {
    try {
      const res = await axios.post(`${apiUrl}/calculator/loan`, {
        loanAmount: loan.amount,
        interestRate: loan.rate,
        termMonths: loan.months
      });
      setMonthly(res.data.monthlyPayment);
      setChartData([
        ['Type', 'Amount'],
        ['Principal', res.data.principal],
        ['Interest', res.data.totalInterest]
      ]);
    } catch (error) {
      alert("An error occurred while calculating the loan. Please try again.");
    }
  };

  const handleCalculationTypeChange = (e) => {
    if (e.target.value === 'custom') {
      setSelectedBank(null);
      setComparison([]);
    } else {
      // Set bank selection mode
      setSelectedBank(''); // Empty string to show bank dropdown
    }
  };

  const handleBankSelect = (bankId) => {
    setSelectedBank(bankId);
    const product = loanProducts.find(p => p.bank_id === bankId);
    if (product) {
      setLoan(prev => ({
        ...prev,
        rate: product.apr
      }));
      // Calculate loan immediately when bank is selected
      handleCalculate();
    }
  };

  const handleCompareBanks = async () => {
    try {
      // Filter eligible products based on amount and term
      const eligibleProducts = loanProducts.filter(product => 
        loan.amount >= product.min_amount && 
        loan.amount <= product.max_amount &&
        loan.months >= product.min_term &&
        loan.months <= product.max_term
      );

      // Calculate comparison data locally
      const comparisonData = eligibleProducts.map(product => {
        const monthlyRate = product.apr / 100 / 12;
        const monthlyPayment = (loan.amount * monthlyRate * Math.pow(1 + monthlyRate, loan.months)) /
                             (Math.pow(1 + monthlyRate, loan.months) - 1);
        const totalPayment = monthlyPayment * loan.months;
        const totalInterest = totalPayment - loan.amount;

        return {
          bankId: product.bank_id,
          bankName: banks.find(b => b.id === product.bank_id)?.name,
          productName: product.name,
          monthlyPayment,
          totalInterest,
          totalPayment,
          apr: product.apr
        };
      });

      setComparison(comparisonData);
    } catch (error) {
      console.error('Error comparing loans:', error);
    }
  };

  const BankComparisonTable = ({ comparison }) => (
    <Card sx={{ mt: 3 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>Bank Loan Comparison</Typography>
        <Grid container spacing={2}>
          {comparison.map((offer, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle1" color="primary">
                    {offer.productName}
                  </Typography>
                  <Stack spacing={1}>
                    <Box>
                      <Typography variant="body2" color="textSecondary">
                        Monthly Payment
                      </Typography>
                      <Typography variant="body1">
                        {formatCurrency(offer.monthlyPayment)}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="textSecondary">
                        Total Interest
                      </Typography>
                      <Typography variant="body1">
                        {formatCurrency(offer.totalInterest)}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="textSecondary">
                        APR
                      </Typography>
                      <Typography variant="body1">
                        {offer.apr}%
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </CardContent>
    </Card>
  );

  const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

  return (
    <Box sx={{ maxWidth: 1200, margin: '0 auto', p: 3 }}>
      <Link to="/">Back to Homepage</Link>
      <Typography variant="h4" gutterBottom align="center">Loan Tools</Typography>

      <Tabs value={currentTab} onChange={(e, v) => setCurrentTab(v)} centered sx={{ mb: 3 }}>
        <Tab label="Loan Calculator" />
        <Tab label="Compare Bank Loans" />
      </Tabs>

      {currentTab === 0 ? (
        <Box>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Calculation Type</InputLabel>
                <Select
                  value={selectedBank === null ? 'custom' : 'bank'}
                  onChange={handleCalculationTypeChange}
                >
                  <MenuItem value="custom">Custom Rate</MenuItem>
                  <MenuItem value="bank">Select Bank</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {selectedBank !== null && (
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Select Bank</InputLabel>
                  <Select
                    value={selectedBank}
                    onChange={(e) => handleBankSelect(e.target.value)}
                    displayEmpty
                  >
                    <MenuItem value="" disabled>Select a bank</MenuItem>
                    {banks.map(bank => (
                      <MenuItem key={bank.id} value={bank.id}>
                        {bank.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            )}

            <Grid item xs={12} sm={6}>
              <Typography gutterBottom>Loan Amount</Typography>
              <Slider
                value={loan.amount}
                min={1000}
                max={1000000}
                step={1000}
                onChange={(e, value) => setLoan({ ...loan, amount: value })}
                valueLabelDisplay="auto"
                valueLabelFormat={(value) => formatCurrency(value)}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <Typography gutterBottom>Loan Term (Months)</Typography>
              <Slider
                value={loan.months}
                min={6}
                max={360}
                step={6}
                onChange={(e, value) => setLoan({ ...loan, months: value })}
                valueLabelDisplay="auto"
              />
            </Grid>

            {!selectedBank && (
              <Grid item xs={12} sm={6}>
                <Typography gutterBottom>Interest Rate (%)</Typography>
                <Slider
                  value={loan.rate}
                  min={1}
                  max={30}
                  step={0.1}
                  onChange={(e, value) => setLoan({ ...loan, rate: value })}
                  valueLabelDisplay="auto"
                />
              </Grid>
            )}

            <Grid item xs={12}>
              <Stack direction="row" spacing={2}>
                <Button variant="contained" onClick={handleCalculate}>
                  Calculate
                </Button>
              </Stack>
            </Grid>
          </Grid>

          {monthly && (
            <Typography variant="h6" sx={{ mt: 3 }}>
              Monthly Payment: {formatCurrency(monthly)}
            </Typography>
          )}

          {chartData.length > 0 && (
            <Chart
              chartType="PieChart"
              data={chartData}
              options={{ title: 'Payment Breakdown' }}
              width="100%"
              height="400px"
            />
          )}
        </Box>
      ) : (
        // Compare Loans tab
        <Box sx={{ width: '100%', p: 2 }}>
          <Typography variant="h5" gutterBottom>Compare Bank Loans</Typography>
          
          {/* Loan Amount and Term Controls */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6}>
              <Typography gutterBottom>Loan Amount</Typography>
              <Slider
                value={loan.amount}
                min={1000}
                max={1000000}
                step={1000}
                onChange={(e, value) => setLoan({ ...loan, amount: value })}
                valueLabelDisplay="auto"
                valueLabelFormat={(value) => formatCurrency(value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography gutterBottom>Loan Term (Months)</Typography>
              <Slider
                value={loan.months}
                min={6}
                max={360}
                step={6}
                onChange={(e, value) => setLoan({ ...loan, months: value })}
                valueLabelDisplay="auto"
              />
            </Grid>
            <Grid item xs={12}>
              <Button 
                variant="contained" 
                onClick={handleCompareBanks}
                fullWidth
              >
                Compare Bank Loans
              </Button>
            </Grid>
          </Grid>

          {/* Bank Comparison Results */}
          {comparison.length > 0 && <BankComparisonTable comparison={comparison} />}
        </Box>
      )}
    </Box>
  );
};

export default LoanCalculator;
