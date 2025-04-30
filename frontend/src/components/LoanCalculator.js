import React, { useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { Slider, Typography } from '@mui/material';
import { Chart } from 'react-google-charts';

const LoanCalculator = () => {
  const [loan, setLoan] = useState({ amount: 5000, rate: 5, months: 12 });
  const [monthly, setMonthly] = useState(null);
  const [chartData, setChartData] = useState([]);

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
    <div>
      <Link to="/">Back to Homepage</Link>
      <h2>Loan Calculator</h2>

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
    </div>
  );
};

export default LoanCalculator;
