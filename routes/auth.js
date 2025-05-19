const express = require('express');
const router = express.Router();
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const GitHubStrategy = require('passport-github2').Strategy;
const { db } = require('../dist/db');
const { user: userTable } = require('../dist/db/schema/user');
const { eq } = require('drizzle-orm');
const bcrypt = require('bcrypt');

passport.use(
    new GoogleStrategy(
        {
            clientID: process.env.GOOGLE_CLIENT_ID || 'test-google-client-id',
            clientSecret:
                process.env.GOOGLE_CLIENT_SECRET || 'test-google-client-secret',
            callbackURL:
                process.env.GOOGLE_CALLBACK_URI ||
                'http://localhost:5000/google/callback',
        },
        async function (accessToken, refreshToken, profile, done) {
            const newProvider = {
                name: 'google',
                providerId: profile.id,
            };
            const newUser = {
                displayName: profile.displayName,
                firstName: profile.name.givenName,
                lastName: profile.name.familyName,
                email:
                    profile.emails && profile.emails[0]
                        ? profile.emails[0].value
                        : '',
                profileImage:
                    profile.photos && profile.photos[0]
                        ? profile.photos[0].value
                        : `https://ui-avatars.com/api/?name=${firstName}+${lastName}`,
                providers: [newProvider],
            };
            try {
                let user = await db
                    .select()
                    .from(userTable)
                    .where(eq(userTable.email, profile.emails[0].value))
                    .limit(1);
                if (user.length > 0) {
                    // Check if the provider is already linked
                    const providerExists = user[0].providers.some(
                        (provider) => provider.name === 'google',
                    );
                    if (!providerExists) {
                        await db
                            .update(userTable)
                            .set({
                                providers: [...user[0].providers, newProvider],
                            })
                            .where(eq(userTable.id, user[0].id));
                    }
                    done(null, user[0]);
                } else {
                    const [createdUser] = await db
                        .insert(userTable)
                        .values(newUser)
                        .returning();
                    done(null, createdUser);
                }
            } catch (error) {
                console.log(error);
                done(error, null);
            }
        },
    ),
);

passport.use(
    new GitHubStrategy(
        {
            clientID: process.env.GITHUB_CLIENT_ID || 'test-github-client-id',
            clientSecret:
                process.env.GITHUB_CLIENT_SECRET || 'test-github-client-secret',
            callbackURL:
                process.env.GITHUB_CALLBACK_URI ||
                'http://localhost:5000/github/callback',
        },
        async function (accessToken, refreshToken, profile, done) {
            const newProvider = {
                name: 'github',
                providerId: profile.id,
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
                email:
                    profile.emails && profile.emails[0]
                        ? profile.emails[0].value
                        : '',
                profileImage:
                    profile.photos && profile.photos[0]
                        ? profile.photos[0].value
                        : `https://ui-avatars.com/api/?name=${firstName}+${lastName}`,
                providers: [newProvider],
            };
            try {
                let user = await db
                    .select()
                    .from(userTable)
                    .where(eq(userTable.email, profile.emails[0].value))
                    .limit(1);
                if (user.length > 0) {
                    // Check if the provider is already linked
                    const providerExists = user[0].providers.some(
                        (provider) => provider.name === 'github',
                    );
                    if (!providerExists) {
                        await db
                            .update(userTable)
                            .set({
                                providers: [...user[0].providers, newProvider],
                            })
                            .where(eq(userTable.id, user[0].id));
                    }
                    done(null, user[0]);
                } else {
                    const [createdUser] = await db
                        .insert(userTable)
                        .values(newUser)
                        .returning();
                    done(null, createdUser);
                }
            } catch (error) {
                console.log(error);
                done(error, null);
            }
        },
    ),
);

// Google auth routes
router.get(
    '/auth/google',
    passport.authenticate('google', { scope: ['profile', 'email'] }),
);

router.get(
    '/google/callback',
    passport.authenticate('google', {
        failureRedirect: '/login-failure',
    }),
    (req, res) => {
        // Check if this was the user's first login
        const isNewUser = req.user.createdAt === req.user.updatedAt;
        res.redirect(isNewUser ? '/update-profile' : '/profile');
    },
);
// GitHub auth routes
router.get(
    '/auth/github',
    passport.authenticate('github', { scope: ['user:email', 'read:user'] }),
);

router.get(
    '/github/callback',
    passport.authenticate('github', {
        failureRedirect: '/login-failure',
    }),
    (req, res) => {
        // Check if this was the user's first login
        const isNewUser = req.user.createdAt === req.user.updatedAt;
        res.redirect(isNewUser ? '/update-profile' : '/profile');
    },
);

router.get('/login', (req, res) => {
    res.render('login', {
        title: 'وصل - تسجيل الدخول',
        HeaderOrSidebar: 'header',
        extraCSS: '<link href="/css/login.css" rel="stylesheet">',
        currentPage: 'login',
    });
});
// TMP Directories
router.post('/login/tmp', async (req, res) => {
    const { email, password } = req.body;
    const user = await db
            .select()
            .from(userTable)
            .where(and(eq(userTable.email, email), eq(userTable.password, password)))
            .limit(1);  
    if (user.length > 0) {
        res.json({
            "data":{
                "token":"1234",
                "user":user[0]
            }
        })
    }
    else {
        res.status(400).json({
            error: "Invalid email or password"
        })
    }
});
router.post('/registr/tmp', async (req, res) => {
    try {
        const { displayName, firstName, lastName, email, password } = req.body;
        
        // Check if user already exists
        const existingUser = await db
            .select()
            .from(userTable)
            .where(eq(userTable.email, email))
            .limit(1);
            
        if (existingUser.length > 0) {
            return res.status(400).json({
                error: "User with this email already exists"
            });
        }
        
        // Create new user
        const newUser = {
            displayName: displayName || `${firstName} ${lastName}`,
            firstName,
            lastName,
            email,
            password: await bcrypt.hash(password, 10),
            profileImage: `https://ui-avatars.com/api/?name=${firstName}+${lastName}`,
            providers: []
        };
        
        const [createdUser] = await db
            .insert(userTable)
            .values(newUser)
            .returning(
                userTable.id,
                userTable.displayName,
                userTable.firstName,
                userTable.lastName,
                userTable.email,
                userTable.profileImage,
                userTable.providers,
            );
            
        // Return token
        res.json({
            "data": {
                "token": "1234", // In a real app, generate a proper JWT token
                "user": createdUser
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            error: "Server error while registering user"
        });
    }
});

router.get('/login-failure', (req, res) => {
    res.send('Something Went Wrong Try again later');
});

// Persist the user data after successful login
passport.serializeUser(function (user, done) {
    done(null, user.id);
});

// Destroy the user data after logout
router.get('/logout', (req, res) => {
    req.session.destroy((error) => {
        if (error) {
            console.log(error);
            res.send('Error Logging out');
        } else {
            res.redirect('/');
        }
    });
});

// Get the user data from the session
passport.deserializeUser(async (id, done) => {
    try {
        const user = await db
            .select()
            .from(userTable)
            .where(eq(userTable.id, id))
            .limit(1);
        done(null, user[0]);
    } catch (error) {
        done(error, null);
    }
});

module.exports = router;
