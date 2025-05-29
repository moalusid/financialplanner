import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { 
  Slider, Typography, Box, Grid, Card, CardContent, 
  FormControl, InputLabel, Select, MenuItem, Divider,
  Stack, Tab, Tabs
} from '@mui/material';
import { Chart } from 'react-google-charts';

const LoanCalculator = () => {
  const [currentTab, setCurrentTab] = useState(0);
  const [loan, setLoan] = useState({ amount: 5000, rate: 5, months: 12 });
  const [monthly, setMonthly] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [debts, setDebts] = useState([]);
  const [selectedDebt1, setSelectedDebt1] = useState(null);
  const [selectedDebt2, setSelectedDebt2] = useState(null);

  useEffect(() => {
    const fetchDebts = async () => {
      try {
        const response = await axios.get('/api/debts');
        setDebts(response.data);
      } catch (error) {
        console.error('Error fetching debts:', error);
      }
    };
    fetchDebts();
  }, []);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-BW', {
      style: 'currency',
      currency: 'BWP',
    }).format(amount);
  };

  const ComparisonTable = () => (
    <Box sx={{ display: 'flex', justifyContent: 'center' }}>
      <Card sx={{ maxWidth: 800, width: '100%', bgcolor: '#f8f9fa' }}>
        <CardContent>
          <Typography variant="h6" gutterBottom align="center">
            Debt Comparison
          </Typography>
          {selectedDebt1 && selectedDebt2 && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card sx={{ height: '100%', bgcolor: '#e3f2fd' }}>
                  <CardContent>
                    <Typography variant="h6" color="primary" gutterBottom>
                      {selectedDebt1.name}
                    </Typography>
                    <Stack spacing={2} divider={<Divider flexItem />}>
                      <Box>
                        <Typography variant="body2" color="textSecondary">Balance</Typography>
                        <Typography variant="body1">{formatCurrency(selectedDebt1.balance)}</Typography>
                      </Box>
                      <Box>
                        <Typography variant="body2" color="textSecondary">Interest Rate</Typography>
                        <Typography variant="body1">{selectedDebt1.interest_rate}%</Typography>
                      </Box>
                      <Box>
                        <Typography variant="body2" color="textSecondary">Monthly Payment</Typography>
                        <Typography variant="body1">{formatCurrency(selectedDebt1.min_payment)}</Typography>
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={6}>
                <Card sx={{ height: '100%', bgcolor: '#fff3e0' }}>
                  <CardContent>
                    <Typography variant="h6" color="secondary" gutterBottom>
                      {selectedDebt2.name}
                    </Typography>
                    <Stack spacing={2} divider={<Divider flexItem />}>
                      <Box>
                        <Typography variant="body2" color="textSecondary">Balance</Typography>
                        <Typography variant="body1">{formatCurrency(selectedDebt2.balance)}</Typography>
                      </Box>
                      <Box>
                        <Typography variant="body2" color="textSecondary">Interest Rate</Typography>
                        <Typography variant="body1">{selectedDebt2.interest_rate}%</Typography>
                      </Box>
                      <Box>
                        <Typography variant="body2" color="textSecondary">Monthly Payment</Typography>
                        <Typography variant="body1">{formatCurrency(selectedDebt2.min_payment)}</Typography>
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}
        </CardContent>
      </Card>
    </Box>
  );

  const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

  const handleCalculate = async () => {
    try {
      const res = await axios.post(`${apiUrl}/loan`, {
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

  return (
    <Box sx={{ maxWidth: 1200, margin: '0 auto', p: 3 }}>
      <Link to="/">Back to Homepage</Link>
      <Typography variant="h4" gutterBottom align="center">Loan Tools</Typography>

      <Tabs value={currentTab} onChange={(e, v) => setCurrentTab(v)} centered sx={{ mb: 3 }}>
        <Tab label="Loan Calculator" />
        <Tab label="Compare Debts" />
      </Tabs>

      {currentTab === 0 ? (
        // Original loan calculator content
        <Box>
          <label>Loan Amount</label>
          <input
            type="number"
            value={loan.amount}
            onChange={(e) => setLoan({ ...loan, amount: parseFloat(e.target.value) || 0 })}
          />

          <label>Interest Rate (%)</label>
          <input
            type="number"
            value={loan.rate}
            onChange={(e) => setLoan({ ...loan, rate: parseFloat(e.target.value) || 0 })}
          />

          <Typography gutterBottom>Loan Term (Months)</Typography>
          <Slider
            value={loan.months}
            min={6}
            max={360}
            step={6}
            onChange={(e, value) => setLoan({ ...loan, months: value })}
            valueLabelDisplay="auto"
          />

          <button onClick={handleCalculate}>Calculate</button>

          {monthly && <p>Monthly Payment: {monthly}</p>}

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
        // Compare Debts tab
        <Box sx={{ width: '100%', p: 2 }}>
          <Typography variant="h5" gutterBottom>Compare Debts</Typography>
          <Grid container spacing={3} sx={{ mb: 4 }}>
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
      )}
    </Box>
  );
};

export default LoanCalculator;
