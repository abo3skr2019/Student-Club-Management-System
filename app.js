require('dotenv').config();

const express = require('express');
const path = require('path');
const passport = require('passport');
const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);
const { Pool } = require('pg');
const { db, connectDB } = require('./dist/db');
const expressLayouts = require('express-ejs-layouts');
const { checkClubAdmin } = require('./backend/middleware/CheckClubAdmin');

const app = express();

// PostgreSQL Pool (Separate from drizzle)
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

// Middleware
app.use(express.json()); // For parsing JSON bodies

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'frontend', 'views'));
app.use(express.static(path.join(__dirname, 'frontend', 'public')));
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

// LAYOUTS
app.use(expressLayouts);
// Set the default layout
app.set('layout', 'layouts/base-layout'); // header-layout is the default layout
// Set view engine to ejs (if not already set)
app.set('view engine', 'ejs');

// add styling for index page
app.get('/', (req, res) =>
    res.render('index', {
        extraCSS: '<link href="/css/index.css" rel="stylesheet">',
    }),
);

app.get('/api', (req, res) => {
    res.json({ message: 'API is working!' });
});

app.get('/event-admin-view', (req, res) => res.render('event-admin-view'));
app.get('/event-user-view', (req, res) => res.render('event-user-view'));

// API Routes
app.use('/clubs', require('./backend/routes/clubRoutes'));
app.use('/events', require('./backend/routes/eventRoutes'));
app.use(require('./backend/routes/auth'));
app.use(require('./backend/routes/profile'));
app.use(require('./backend/routes/main-misc'));

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
