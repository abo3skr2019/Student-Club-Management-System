const express = require('express');
const app = express();
const clubRoutes = require('./routes/clubRoutes');

// Middleware
app.use(express.json());

// Club API
app.use('/api/clubs', clubRoutes);

// Start the server
app.listen(3000, () => {
    console.log('Server is running on http://localhost:3000');
});