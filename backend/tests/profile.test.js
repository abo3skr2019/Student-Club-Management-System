const request = require('supertest');
const express = require('express');
const router = require('../routes/profile');
const User = require('../models/User');
const { isAuthenticated } = require('../middleware/CheckAuth');

jest.mock('../models/User');
jest.mock('../middleware/CheckAuth');

const app = express();
app.use(express.urlencoded({ extended: false }));
app.use('/', router);

describe('Profile Routes', () => {
    beforeEach(() => {
        isAuthenticated.mockImplementation((req, res, next) => next());
    });

    describe('GET /update-profile', () => {
        it('should render the update-profile form', async () => {
            const req = { user: { id: '123', firstName: 'John', lastName: 'Doe' } };
            const res = await request(app).get('/update-profile').set('user', req.user);
            expect(res.status).toBe(200);
            expect(res.text).toContain('update-profile');
        });
    });

    describe('POST /update-profile', () => {
        it('should update the user profile and redirect to /profile', async () => {
            const req = { user: { id: '123' }, body: { firstName: 'Jane', lastName: 'Doe' } };
            User.findById.mockResolvedValue({ save: jest.fn() });
            const res = await request(app).post('/update-profile').send(req.body).set('user', req.user);
            expect(User.findById).toHaveBeenCalledWith('123');
            expect(res.status).toBe(302);
            expect(res.header.location).toBe('/profile');
        });

        it('should redirect to /update-profile on error', async () => {
            const req = { user: { id: '123' }, body: { firstName: 'Jane', lastName: 'Doe' } };
            User.findById.mockRejectedValue(new Error('Error'));
            const res = await request(app).post('/update-profile').send(req.body).set('user', req.user);
            expect(res.status).toBe(302);
            expect(res.header.location).toBe('/update-profile');
        });
    });

    describe('GET /profile', () => {
        it('should render the user profile', async () => {
            const req = { user: { id: '123' } };
            User.findById.mockResolvedValue({ firstName: 'John', lastName: 'Doe' });
            const res = await request(app).get('/profile').set('user', req.user);
            expect(res.status).toBe(200);
            expect(res.text).toContain('John');
            expect(res.text).toContain('Doe');
        });

        it('should return 404 if user not found', async () => {
            const req = { user: { id: '123' } };
            User.findById.mockResolvedValue(null);
            const res = await request(app).get('/profile').set('user', req.user);
            expect(res.status).toBe(404);
            expect(res.text).toBe('User not found');
        });

        it('should return 500 on server error', async () => {
            const req = { user: { id: '123' } };
            User.findById.mockRejectedValue(new Error('Error'));
            const res = await request(app).get('/profile').set('user', req.user);
            expect(res.status).toBe(500);
            expect(res.text).toBe('Server error');
        });
    });
});