const express = require("express");
const router = express.Router();
const { v4: uuidv4 } = require('uuid'); // Import uuid
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const GitHubStrategy = require("passport-github2").Strategy;
const User = require("../models/User");

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URI || "http://localhost:5000/google/callback"
},
    async function (accessToken, refreshToken, profile, done) {
        const newProvider = {
            name: 'google',
            providerId: profile.id
        };
        const newUser = {
            id: uuidv4(), // Generate a unique id
            displayName: profile.displayName,
            firstName: profile.name.givenName,
            lastName: profile.name.familyName,
            email: profile.emails[0].value,
            profileImage: profile.photos[0].value,
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
    clientID: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    callbackURL: process.env.GITHUB_CALLBACK_URI || "http://localhost:5000/github/callback"
},
    async function (accessToken, refreshToken, profile, done) {
        const newProvider = {
            name: 'github',
            providerId: profile.id
        };
        const newUser = {
            id: uuidv4(), // Generate a unique id
            displayName: profile.displayName,
            firstName: profile.name.givenName,
            lastName: profile.name.familyName,
            email: profile.emails[0].value,
            profileImage: profile.photos[0].value,
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
        res.redirect('/update-profile');
    });
// GitHub auth routes
router.get('/auth/github',
    passport.authenticate('github', { scope: ['user:email'] }));

router.get('/github/callback',
    passport.authenticate('github', {
        failureRedirect: '/login-failure'
    }), (req, res) => {
        res.redirect('/update-profile');
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