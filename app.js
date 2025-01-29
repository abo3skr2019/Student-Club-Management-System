const express = require('express');
const path = require('path');
const mongoose = require('mongoose');

const passport = require('passport');
const session = require('express-session');
const dotenv = require('dotenv');
const connectDB = require('./backend/config/db');
const SessionDBStore = require('connect-mongo');

const expressLayouts = require('express-ejs-layouts');


// Initialize environment variables from .env file
dotenv.config();

const app = express();

// Middleware
app.use(express.json());  // For parsing JSON bodies

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'frontend', 'views'));
app.use(express.static(path.join(__dirname, 'frontend', 'public')));
app.use(express.urlencoded({ extended: true }));


// Initialize session and passport
app.use(session({
secret: process.env.SESSION_SECRET || 'secret',
resave: false,
saveUninitialized: false,
store: SessionDBStore.create({ mongoUrl: process.env.MONGODB_URI }),
 cookie: {maxAge: 86400000} // 1 day
}));
app.use(passport.initialize());
app.use(passport.session());

// Connect to database
connectDB();

// Middleware used to attach user to res.locals for dynamic header changes
app.use(async (req, res, next) => {
    if (req.user) {
        try {
            // If user is a ClubAdmin, find their club
            if (req.user.role === 'ClubAdmin') {
                const Club = require('./backend/models/Club');
                const club = await Club.findOne({ clubAdmin: req.user._id });
                if (club) {
                    req.user.clubUUID = club.uuid;  // Add the UUID to the user object
                }
            }
        } catch (err) {
            console.error('Error fetching club UUID:', err);
        }
    }
    res.locals.user = req.user || null;
    next();
});


// LAYOUTS
app.use(expressLayouts);
// Set the default layout
app.set('layout', 'layouts/base-layout'); // header-layout is the default layout
// Set view engine to ejs (if not already set)
app.set('view engine', 'ejs');

// header-layout routes
app.get('/', (req, res) => {
    res.render('index', { currentPage: 'index' });
});

app.get('/login', (req, res) => {
    res.render('login', {
        title: "وصل - تسجيل الدخول",
        HeaderOrSidebar: 'header',
        extraCSS: '<link href="/css/login.css" rel="stylesheet">',
        currentPage: 'login'
    });
});

// other routes that need to be labeled under the correct layout
app.get('/events', (req, res) => res.render('events'));
app.get('/event-admin-view', (req, res) => res.render('event-admin-view'));
app.get('/event-user-view', (req, res) => res.render('event-user-view'));
app.get('/club-admin-dashboard', (req, res) => { res.render('club-admin-dashboard');
});



// API Routes
app.use('/clubs', require('./backend/routes/clubRoutes'));
app.use(require('./backend/routes/auth'));
app.use(require('./backend/routes/profile'));

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});

// Export for testing
module.exports = app;