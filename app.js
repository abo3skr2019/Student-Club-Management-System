const express = require('express');
const path = require('path');

const app = express();

app.set('view engine', 'ejs');

app.set('views', path.join(__dirname, 'frontend', 'views'));

app.use(express.static(path.join(__dirname, 'frontend', 'public')));

// Routes for EJS templates
app.get('/', (req, res) => res.render('index'));
app.get('/login', (req, res) => res.render('login'));
app.get('/profile', (req, res) => res.render('profile'));
app.get('/club-dashboard', (req, res) => res.render('club-dashboard'));
app.get('/event-creation', (req, res) => res.render('event-creation'));
app.get('/feed', (req, res) => res.render('feed'));
app.get('/event-admin-view', (req, res) => res.render('event-admin-view'));
app.get('/event-user-view', (req, res) => res.render('event-user-view'));

// Start the server
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});
