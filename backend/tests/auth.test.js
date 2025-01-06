const request = require('supertest');
const express = require('express');
const passport = require('passport');
const session = require('express-session');
// Mock the User model
jest.mock('../models/User', () => ({
    findOne: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
}));

const User = require('../models/User');

// Import the router
const authRouter = require('../routes/auth');

// Create an express app for testing
const app = express();
app.use(session({ secret: 'test-secret', resave: false, saveUninitialized: false }));
app.use(passport.initialize());
app.use(passport.session());
app.use(authRouter);

describe('Authentication Routes', () => {
    beforeEach(() => {
        // Clear mock calls before each test
        jest.clearAllMocks();
    });

    describe('Google Strategy', () => {
        test('should initialize Google strategy with correct credentials', () => {
            const googleStrategy = passport._strategies.google;

            expect(googleStrategy._oauth2._clientId).toBe('test-google-client-id');
            expect(googleStrategy._oauth2._clientSecret).toBe('test-google-client-secret');
            expect(googleStrategy._callbackURL).toBe('http://localhost:5000/google/callback');
        });

        test('should handle Google authentication callback', async () => {
            User.findOne.mockResolvedValueOnce(null); // Simulate no user found
            User.create.mockResolvedValueOnce({ id: '123', email: 'test@gmail.com' }); // Simulate user creation

            // Mocking Passport's done method
            const done = jest.fn();

            // Mock profile object from Google
            const profile = {
                id: 'google-id',
                displayName: 'Test User',
                name: { givenName: 'Test', familyName: 'User' },
                emails: [{ value: 'test@gmail.com' }],
                photos: [{ value: 'http://photo-url.com' }],
            };

            const googleStrategy = passport._strategies.google;

            // Simulate the strategy's verification function
            await googleStrategy._verify(null, null, profile, done);

            expect(User.findOne).toHaveBeenCalledWith({ email: 'test@gmail.com' });
            expect(User.create).toHaveBeenCalledWith(expect.objectContaining({
                email: 'test@gmail.com',
                displayName: 'Test User',
            }));
            expect(done).toHaveBeenCalledWith(null, expect.objectContaining({ email: 'test@gmail.com' }));
        });
    });

    describe('GitHub Strategy', () => {
        test('should initialize GitHub strategy with correct credentials', () => {
            const githubStrategy = passport._strategies.github;

            expect(githubStrategy._oauth2._clientId).toBe('test-github-client-id');
            expect(githubStrategy._oauth2._clientSecret).toBe('test-github-client-secret');
            expect(githubStrategy._callbackURL).toBe('http://localhost:5000/github/callback');
        });

        test('should handle GitHub authentication callback', async () => {
            User.findOne.mockResolvedValueOnce(null); // Simulate no user found
            User.create.mockResolvedValueOnce({ id: '123', email: 'test@github.com' }); // Simulate user creation

            // Mocking Passport's done method
            const done = jest.fn();

            // Mock profile object from GitHub
            const profile = {
                id: 'github-id',
                displayName: 'GitHub User',
                username: 'githubuser',
                emails: [{ value: 'test@github.com' }],
                photos: [{ value: 'http://github-photo-url.com' }],
            };

            const githubStrategy = passport._strategies.github;

            // Simulate the strategy's verification function
            await githubStrategy._verify(null, null, profile, done);

            expect(User.findOne).toHaveBeenCalledWith({ email: 'test@github.com' });
            expect(User.create).toHaveBeenCalledWith(expect.objectContaining({
                email: 'test@github.com',
                displayName: 'GitHub User',
            }));
            expect(done).toHaveBeenCalledWith(null, expect.objectContaining({ email: 'test@github.com' }));
        });
    });

    describe('Routes', () => {
        test('should redirect to Google for authentication', async () => {
            const response = await request(app).get('/auth/google');

            expect(response.statusCode).toBe(302);
            expect(response.header['location']).toContain('https://accounts.google.com/o/oauth2/v2/auth');
        });

        test('should redirect to GitHub for authentication', async () => {
            const response = await request(app).get('/auth/github');

            expect(response.statusCode).toBe(302);
            expect(response.header['location']).toContain('https://github.com/login/oauth/authorize');
        });

        test('should handle login failure', async () => {
            const response = await request(app).get('/login-failure');

            expect(response.statusCode).toBe(200);
            expect(response.text).toBe('Something Went Wrong Try again later');
        });
    });
});
