const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const clubRoutes = require('./backend/routes/clubRoutes');

const passport = require('passport');
const session = require('express-session');
const dotenv = require('dotenv');
dotenv.config();
const app = express();

// Middleware
app.use(express.json());  // For parsing JSON bodies
app.use(express.urlencoded({ extended: true }));  // For parsing URL-encoded bodies

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'frontend', 'views'));
app.use(express.static(path.join(__dirname, 'frontend', 'public')));
app.use(express.urlencoded({ extended: true }));

// Initialize session and passport
app.use(session({
    secret: process.env.SESSION_SECRET || 'secret',
    resave: false,
    saveUninitialized: false 
}));
app.use(passport.initialize());
app.use(passport.session());

// Routes for EJS templates
app.get('/', (req, res) => res.render('index'));
app.get('/login', (req, res) => res.render('login'));
app.get('/profile', (req, res) => res.render('profile'));
app.get('/club-dashboard', (req, res) => res.render('club-dashboard'));
app.get('/event-creation', (req, res) => res.render('event-creation'));
app.get('/feed', (req, res) => res.render('feed'));
app.get('/event-admin-view', (req, res) => res.render('event-admin-view'));
app.get('/event-user-view', (req, res) => res.render('event-user-view'));

// API Routes
app.use('/api/clubs', clubRoutes);
app.use(require('./backend/routes/auth'));
app.use(require('./backend/routes/profile'));


// Database connection
mongoose.connect(process.env.MONGO_URL)
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('MongoDB connection error:', err));
// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});

// Export for testing
module.exports = app;