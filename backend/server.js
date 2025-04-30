const express = require('express');
const cors = require('cors');
require('dotenv').config();
const calculatorRoutes = require('./routes/calculatorRoutes');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api', require('./routes/calculatorRoutes'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
