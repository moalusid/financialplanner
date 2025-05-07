const express = require('express');
const cors = require('cors');
const pool = require('./database/config');
const config = require('./database/config');
const calculatorRoutes = require('./routes/calculatorRoutes');
const incomeRoutes = require('./routes/incomeroutes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/calculator', calculatorRoutes);
app.use('/api/income', incomeRoutes);

//example route
app.get('/', (req, res) => {
    res.send('Financial Planner API is running');
}
);

//Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});