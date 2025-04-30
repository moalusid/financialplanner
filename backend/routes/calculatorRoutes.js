const express = require('express');
const router = express.Router();
const calculatorController = require('../controllers/calculatorController');

router.post('/loan', calculatorController.calculateLoan);

module.exports = router;

