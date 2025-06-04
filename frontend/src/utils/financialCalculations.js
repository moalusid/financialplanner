/**
 * Calculates loan payoff details including dates and interest
 * @param {number} balance - Initial loan balance
 * @param {number} rate - Annual interest rate (as percentage)
 * @param {number} payment - Monthly payment amount
 * @returns {Object|null} Payoff details or null if invalid inputs
 */
export const calculatePayoffDetails = (balance, rate, payment) => {
    try {
        if (!balance || !rate || !payment || balance <= 0 || payment <= 0) {
            return null;
        }

        const monthlyRate = Number(rate) / 100 / 12;
        let remainingBalance = Number(balance);
        let totalInterest = 0;
        let months = 0;
        const maxMonths = 600; // 50 years

        // Check if monthly payment covers interest
        const initialMonthlyInterest = remainingBalance * monthlyRate;
        if (payment <= initialMonthlyInterest) {
            return null; // Payment too low to ever pay off debt
        }

        // Calculate full months until payment would exceed remaining balance
        while (remainingBalance > 0.01 && months < maxMonths) {
            const monthlyInterest = remainingBalance * monthlyRate;
            totalInterest += monthlyInterest;
            remainingBalance = remainingBalance + monthlyInterest - payment;
            months++;
        }

        // If we hit the max months, the loan is too long
        if (months >= maxMonths) {
            return null;
        }

        // Calculate remaining days in final partial month
        const finalMonthInterest = remainingBalance * monthlyRate;
        const finalBalance = remainingBalance + finalMonthInterest;
        const overPayment = payment - finalBalance;
        const daysInLastMonth = Math.round((1 - (overPayment / payment)) * 30);

        const startDate = new Date();
        const payoffDate = new Date(startDate);
        payoffDate.setMonth(payoffDate.getMonth() + months);
        payoffDate.setDate(payoffDate.getDate() + daysInLastMonth);

        return {
            payoffDate,
            totalInterest: totalInterest + finalMonthInterest,
            months,
            days: daysInLastMonth,
            totalDays: (months * 30) + daysInLastMonth
        };
    } catch (error) {
        console.error('Error calculating payoff details:', error);
        return null;
    }
};

/**
 * Calculates the required monthly payment at new interest rate to maintain original payoff period
 * @param {number} balance - Loan balance
 * @param {number} oldRate - Original annual interest rate (as percentage)
 * @param {number} newRate - New annual interest rate (as percentage)
 * @param {number} currentPayment - Current monthly payment
 * @returns {number} Required monthly payment at new rate
 */
export const calculateRequiredPayment = (balance, oldRate, newRate, currentPayment) => {
    try {
        // Get total months from calculatePayoffDetails
        const originalPayoff = calculatePayoffDetails(balance, oldRate, currentPayment);
        if (!originalPayoff) return currentPayment;

        const totalMonths = originalPayoff.months + (originalPayoff.days / 30);
        const newMonthlyRate = newRate / 100 / 12;

        // Calculate required payment at new rate for same period
        const newPayment = (balance * newMonthlyRate * Math.pow(1 + newMonthlyRate, totalMonths)) / 
                          (Math.pow(1 + newMonthlyRate, totalMonths) - 1);

        return Math.round(newPayment * 100) / 100;
    } catch (error) {
        console.error('Error calculating required payment:', error);
        return currentPayment;
    }
};

/**
 * Generates monthly installment dates for a debt
 * @param {Object} debt - Debt object with balance, interest_rate, min_payment, payment_date
 * @returns {Array} Array of installment objects with dates and amounts
 */
export const generateDebtInstallments = (debt) => {
    if (!debt.payment_date || !debt.balance || !debt.min_payment) return [];
    
    const payoffDetails = calculatePayoffDetails(debt.balance, debt.interest_rate, debt.min_payment);
    if (!payoffDetails) return [];

    const installments = [];
    const startDate = new Date();
    const months = payoffDetails.months;

    for (let i = 0; i < months; i++) {
        const installmentDate = new Date(
            startDate.getFullYear(),
            startDate.getMonth() + i,
            debt.payment_date
        );
        
        installments.push({
            due_date: installmentDate.toISOString().split('T')[0],
            amount: debt.min_payment,
            description: `${debt.name} Installment`,
            category: 'Debt Payments',
            classification: 'Essentials',
            reminder_days: 7,
            debt_id: debt.id
        });
    }

    return installments;
};

/**
 * Calculates loan details for multiple banks
 * @param {number} amount - Loan amount
 * @param {number} months - Loan term in months
 * @param {Array} bankProducts - Array of bank loan products
 * @returns {Array} Comparison of loan details for each bank
 */
export const compareBankLoans = (amount, months, bankProducts) => {
    return bankProducts.map(product => {
        if (amount < product.min_amount || amount > product.max_amount ||
            months < product.min_term || months > product.max_term) {
            return null;
        }

        const monthlyRate = product.apr / 100 / 12;
        const monthlyPayment = (amount * monthlyRate * Math.pow(1 + monthlyRate, months)) /
                             (Math.pow(1 + monthlyRate, months) - 1);
        const totalPayment = monthlyPayment * months;
        const totalInterest = totalPayment - amount;

        return {
            bankId: product.bank_id,
            productId: product.id,
            productName: product.name,
            monthlyPayment: Math.round(monthlyPayment * 100) / 100,
            totalInterest: Math.round(totalInterest * 100) / 100,
            totalPayment: Math.round(totalPayment * 100) / 100,
            apr: product.apr
        };
    }).filter(result => result !== null);
};

// Add more financial calculation functions here as needed
