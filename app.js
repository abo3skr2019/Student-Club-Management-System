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


// Routes for EJS templates

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

app.get('/profile', (req, res) => {
    res.render('profile', {
        title: "وصل - الملف الشخصي",
        HeaderOrSidebar: 'header',
        extraCSS: '<link href="/css/profile.css" rel="stylesheet">',
        currentPage: 'profile',
        user: req.user
    });
});

app.get('/update-profile', (req, res) => {
    res.render('update-profile', {
        title: "وصل - تحديث الملف الشخصي",
        HeaderOrSidebar: 'header',
        extraCSS: '<link href="/css/update-profile.css" rel="stylesheet">',
        currentPage: 'update-profile',
        user: req.user
    });
});

app.get('/delete-account', (req, res) => {
    res.render('delete-account', {
        title: "وصل - حذف الحساب",
        HeaderOrSidebar: 'header',
        extraCSS: '<link href="/css/delete-account.css" rel="stylesheet">',
        currentPage: 'delete-account',
        user: req.user
    });
});

// sidebar-layout routes
app.get('/club-dashboard', (req, res) => {
    res.render('club-dashboard', {
        title: "وصل - لوحة التحكم",
        HeaderOrSidebar: 'sidebar',
        extraCSS: '<link href="/css/club-dashboard.css" rel="stylesheet">',
        currentPage: 'club-dashboard'

    });
});
app.get('/event-creation', (req, res) => {
    res.render('event-creation', {
        title: "وصل - إنشاء فعالية",
        HeaderOrSidebar: 'sidebar',
        extraCSS: '<link href="/css/event-creation.css" rel="stylesheet">',
        currentPage: 'event-creation'
    });
});

// other routes that need to be labeled under the correct layout
app.get('/feed', (req, res) => res.render('feed'));
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