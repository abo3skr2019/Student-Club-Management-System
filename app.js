const express = require('express');
const path = require('path');
const mongoose = require('mongoose');

const passport = require('passport');
const session = require('express-session');
const dotenv = require('dotenv');
const connectDB = require('./backend/config/db');
const SessionDBStore = require('connect-mongo');

const expressLayouts = require('express-ejs-layouts');
const { checkClubAdmin } = require("./backend/middleware/CheckClubAdmin");


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

app.use(checkClubAdmin);



// LAYOUTS
app.use(expressLayouts);
// Set the default layout
app.set('layout', 'layouts/base-layout'); // header-layout is the default layout
// Set view engine to ejs (if not already set)
app.set('view engine', 'ejs');

// add styling for index page
app.get('/', (req, res) => res.render('index', {extraCSS: '<link href="/css/index.css" rel="stylesheet">'}));



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
app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});

// Export for testing
module.exports = app;