const express = require('express');
const router = express.Router();
const calculatorController = require('../controllers/calculatorController');

router.post('/loan', calculatorController.calculateLoan);
router.get('/banks', calculatorController.getBanks);
router.get('/loan-products', calculatorController.getLoanProducts);
router.post('/compare-loans', calculatorController.compareBankLoans);

module.exports = router;

