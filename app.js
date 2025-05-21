require('dotenv').config();

const express = require('express');
const passport = require('passport');
const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);
const { Pool } = require('pg');
const { db, connectDB } = require('./dist/db');

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

// API endpoint for health check
app.get('/api', (req, res) => {
    res.json({ message: 'API is working!' });
});

// API Routes (including TypeScript route files)
app.use('/clubs', require('./routes/clubRoutes'));
app.use('/events', require('./routes/eventRoutes'));
app.use('/images', require('./routes/imgRoutes'));
app.use(require('./routes/auth'));
app.use(require('./routes/profile'));
app.use(require('./routes/main-misc'));

// Global error handlers
const createError = require('http-errors');

// Catch 404 for routes not found
app.use((req, res, next) => {
    next(createError(404, 'Endpoint not found'));
});

// Global error handler
app.use((err, req, res, next) => {
    console.error(err);

    // Get status code (default to 500 if not an HTTP error)
    const status = err.status || err.statusCode || 500;

    // Format the error response
    const errorResponse = {
        error: {
            code: status >= 500 ? 'INTERNAL_ERROR' : err.code || String(status),
            message:
                status >= 500 && process.env.NODE_ENV === 'production'
                    ? 'Internal Server Error'
                    : err.message || 'Something went wrong',
        },
    };

    // Include error details in development
    if (process.env.NODE_ENV !== 'production' && err.stack) {
        errorResponse.error.stack = err.stack;
    }

    res.status(status).json(errorResponse);
});

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
