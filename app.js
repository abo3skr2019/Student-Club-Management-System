require('dotenv').config();

const express = require('express');
const passport = require('passport');
const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);
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

// Initialize session and passport
app.use(
    session({
        secret: process.env.SESSION_SECRET || 'secret',
        resave: false,
        saveUninitialized: false,
        store: new pgSession({
            pool,
            tableName: 'sessions',
            createTableIfMissing: true,
        }),
        cookie: { maxAge: 86400000 }, // 1 day
    }),
);
app.use(passport.initialize());
app.use(passport.session());

app.use(checkClubAdmin);

// API endpoint for health check
app.get('/api', (req, res) => {
    res.json({ message: 'API is working!' });
});

// API Routes
app.use('/clubs', require('./routes/clubRoutes'));
app.use('/events', require('./routes/eventRoutes'));
app.use(require('./routes/auth'));
app.use(require('./routes/profile'));
app.use(require('./routes/main-misc'));

// Start the server
const PORT = process.env.PORT || 3000;

// Connect to database and start server
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

// Export for testing
module.exports = app;
