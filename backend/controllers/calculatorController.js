exports.calculateLoan = (req, res) => {
  const { loanAmount, interestRate, termMonths } = req.body;

  const principal = parseFloat(loanAmount);
  const rate = parseFloat(interestRate);
  const months = parseFloat(termMonths);

  if (isNaN(principal) || isNaN(rate) || isNaN(months)) {
    return res.status(400).json({ error: "Invalid input values" });
  }

  const r = rate / 100 / 12;
  const n = months;
  const monthly = (principal * r) / (1 - Math.pow(1 + r, -n));
  const roundedMonthly = parseFloat(monthly.toFixed(2));

  res.json({ monthlyPayment: roundedMonthly });
};

