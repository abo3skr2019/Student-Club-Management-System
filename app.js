require('dotenv').config();

const express = require('express');
const path = require('path');
const { Pool } = require('pg');
const { db, connectDB } = require('./dist/db');
const { checkClubAdmin } = require('./middleware/CheckClubAdmin');

const app = express();

// PostgreSQL Pool (Separate from drizzle)
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

// Middleware
app.use(express.json()); // For parsing JSON bodies

app.use(express.urlencoded({ extended: true }));
app.get('/api', (req, res) => {
    res.json({ message: 'API is working!' });
});
// API Routes
app.use('/clubs', require('./routes/clubRoutes'));
app.use('/events', require('./routes/eventRoutes'));
app.use('/auth', require('./routes/auth'));
app.use(require('./routes/profile'));
app.use(require('./routes/main-misc'));

// Start the server
const PORT = process.env.PORT || 3000;

// Connect to database and start server (skip during tests)
if (process.env.NODE_ENV !== 'test') {
    connectDB()
        .then(() => {
            app.listen(PORT, () => {
                console.log(`Server is running at http://localhost:${PORT}`);
            });
        })
        .catch((err) => {
            console.error('Failed to start server:', err);
            process.exit(1);
        });
}

// Export for testing
module.exports = app;
