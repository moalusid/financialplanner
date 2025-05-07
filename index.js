const express = require('express');
const app = express();
const port = 3000;

// Define a route for the root path
app.get('/', (req, res) => {
    res.send('Welcome to My Financial Planner API');
});

// ...existing code...

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});