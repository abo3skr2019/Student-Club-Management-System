const express = require('express');
const path = require('path');
const passport = require('passport');
const session = require('express-session');
const dotenv = require('dotenv');
const connectDB = require('./backend/config/db');
const SessionDBStore = require('connect-mongo');

// Initialize environment variables from .env file
dotenv.config();

const app = express();

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
connectDB().then(() => {
    console.log('Connected to database');
}).catch(err => {
    console.log(err);
    process.exit(1);
});

// Routes for EJS templates
app.get('/', (req, res) => res.render('index'));
app.get('/login', (req, res) => res.render('login'));
app.get('/club-dashboard', (req, res) => res.render('club-dashboard'));
app.get('/event-creation', (req, res) => res.render('event-creation'));
app.get('/feed', (req, res) => res.render('feed'));
app.get('/event-admin-view', (req, res) => res.render('event-admin-view'));
app.get('/event-user-view', (req, res) => res.render('event-user-view'));

// Include authentication routes
app.use(require('./backend/routes/auth'));
app.use(require('./backend/routes/profile'));

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});
