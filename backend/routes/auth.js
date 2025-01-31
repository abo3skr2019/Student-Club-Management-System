const express = require("express");
const router = express.Router();
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const GitHubStrategy = require("passport-github2").Strategy;
const User = require("../models/User");

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID || "test-google-client-id",
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || "test-google-client-secret",
    callbackURL: process.env.GOOGLE_CALLBACK_URI || "http://localhost:5000/google/callback"
},
    async function (accessToken, refreshToken, profile, done) {
        const newProvider = {
            name: 'google',
            providerId: profile.id
        };
        const newUser = {
            displayName: profile.displayName,
            firstName: profile.name.givenName,
            lastName: profile.name.familyName,
            email: profile.emails && profile.emails[0] ? profile.emails[0].value : '',
            profileImage: profile.photos && profile.photos[0] ? profile.photos[0].value : `https://ui-avatars.com/api/?name=${firstName}+${lastName}`,
            providers: [newProvider]
        };
        try {
            let user = await User.findOne({ email: profile.emails[0].value });
            if (user) {
                // Check if the provider is already linked
                const providerExists = user.providers.some(provider => provider.name === 'google');
                if (!providerExists) {
                    user.providers.push(newProvider);
                    await user.save();
                }
                done(null, user);
            } else {
                user = await User.create(newUser);
                done(null, user);
            }
        } catch (error) {
            console.log(error);
            done(error, null);
        }
    }
));

passport.use(new GitHubStrategy({
    clientID: process.env.GITHUB_CLIENT_ID || "test-github-client-id",
    clientSecret: process.env.GITHUB_CLIENT_SECRET || "test-github-client-secret",
    callbackURL: process.env.GITHUB_CALLBACK_URI || "http://localhost:5000/github/callback"
},
    async function (accessToken, refreshToken, profile, done) {
        const newProvider = {
            name: 'github',
            providerId: profile.id
        };
        let firstName, lastName;
        if (profile.name) {
            firstName = profile.name.givenName;
            lastName = profile.name.familyName;
        } else if (profile.displayName) {
            const nameParts = profile.displayName.split(' ');
            firstName = nameParts[0];
            lastName = nameParts.slice(1).join(' ');
        } else {
            firstName = profile.username;
            lastName = '';
        }

        const newUser = {
            displayName: profile.displayName,
            firstName: firstName,
            lastName: lastName,
            email: profile.emails && profile.emails[0] ? profile.emails[0].value : '',
            profileImage: profile.photos && profile.photos[0] ? profile.photos[0].value : `https://ui-avatars.com/api/?name=${firstName}+${lastName}`,
            providers: [newProvider]
        };
        try {
            let user = await User.findOne({ email: profile.emails[0].value });
            if (user) {
                // Check if the provider is already linked
                const providerExists = user.providers.some(provider => provider.name === 'github');
                if (!providerExists) {
                    user.providers.push(newProvider);
                    await user.save();
                }
                done(null, user);
            } else {
                user = await User.create(newUser);
                done(null, user);
            }
        } catch (error) {
            console.log(error);
            done(error, null);
        }
    }
));

// Google auth routes
router.get('/auth/google',
    passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get('/google/callback',
    passport.authenticate('google', {
        failureRedirect: '/login-failure'
    }), (req, res) => {
        // Check if this was the user's first login
        const isNewUser = req.user.createdAt === req.user.updatedAt;
        res.redirect(isNewUser ? '/update-profile' : '/profile');
    });
// GitHub auth routes
router.get('/auth/github',
    passport.authenticate('github', { scope: ['user:email','read:user'] }));

router.get('/github/callback',
    passport.authenticate('github', {
        failureRedirect: '/login-failure'
    }), (req, res) => {
        // Check if this was the user's first login
        const isNewUser = req.user.createdAt === req.user.updatedAt;
        res.redirect(isNewUser ? '/update-profile' : '/profile');
    });

router.get('/login', (req, res) => {
    res.render('login', {
        title: "وصل - تسجيل الدخول",
        HeaderOrSidebar: 'header',
        extraCSS: '<link href="/css/login.css" rel="stylesheet">',
        currentPage: 'login'
    });
});

router.get("/login-failure", (req, res) => {
    res.send("Something Went Wrong Try again later");
});

// Persist the user data after successful login
passport.serializeUser(function (user, done) {
    done(null, user.id);
});

// Destroy the user data after logout
router.get("/logout", (req, res) => {
    req.session.destroy(error => {
        if (error) {
            console.log(error);
            res.send("Error Logging out");
        } else {
            res.redirect('/');
        }
    });
});

// Get the user data from the session
passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id);
        done(null, user);
    } catch (error) {
        done(error, null);
    }
});

module.exports = router;