const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');

const errorHandler = (err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal Server Error';
    
    res.status(statusCode).json({
        error: message
    });
};

// Club model mock
jest.mock('../models/Club', () => {
    class MockClub {
        constructor(data) {
            Object.assign(this, data);
            this._id = 'new-id';
        }

        save() {
            return Promise.resolve(this);
        }
    }

    // Add static methods to the MockClub class
    MockClub.find = jest.fn();
    MockClub.findById = jest.fn();
    MockClub.findOne = jest.fn();
    MockClub.findByIdAndUpdate = jest.fn();

    return MockClub;
});

// Mock the User model
jest.mock('../models/User', () => ({
    findById: jest.fn(),
    findOne: jest.fn(),
}));

const Club = require('../models/Club');
const User = require('../models/User');
const clubController = require('../controllers/clubController');

const app = express();
app.use(express.json());

// Mock authentication and authorization middleware
const isAuthenticated = (req, res, next) => {
    req.user = { _id: 'mockUserId', role: 'Admin' }; // Mock authenticated user
    next();
};
const isAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'Admin') {
        return next();
    }
    res.status(403).json({ error: 'Admin access required' });
};

app.get('/api/clubs', clubController.getAllClubs);
app.get('/api/clubs/:clubId', clubController.getClubById);
app.post('/api/clubs', isAuthenticated, isAdmin, clubController.createClub);
app.put('/api/clubs/:clubId', isAuthenticated, isAdmin, clubController.updateClub);
app.post('/api/clubs/:clubId/assign-admin', isAuthenticated, clubController.assignClubAdmin);

app.use(errorHandler);

describe('Club Controller', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('GET /api/clubs', () => {
        test('should return all clubs', async () => {
            const mockClubs = [
                { _id: '1', name: 'Club 1', description: 'Desc 1', logo: 'logo1.jpg' },
                { _id: '2', name: 'Club 2', description: 'Desc 2', logo: 'logo2.jpg' }
            ];

            Club.find.mockResolvedValueOnce(mockClubs);

            const response = await request(app).get('/api/clubs');

            expect(response.statusCode).toBe(200);
            expect(response.body).toHaveLength(2);
            expect(response.body[0]).toHaveProperty('id', '1');
            expect(response.body[0]).toHaveProperty('name', 'Club 1');
            expect(Club.find).toHaveBeenCalled();
        });

        test('should handle errors when fetching clubs', async () => {
            Club.find.mockRejectedValueOnce(new Error('Database error'));

            const response = await request(app).get('/api/clubs');

            expect(response.statusCode).toBe(500);
            expect(response.body).toHaveProperty('error', 'Error fetching clubs');
        });
    });

    describe('GET /api/clubs/:clubId', () => {
        test('should return specific club', async () => {
            const mockClub = {
                _id: '1',
                name: 'Test Club',
                description: 'Test Description',
                logo: 'test-logo.jpg'
            };

            Club.findById.mockResolvedValueOnce(mockClub);

            const response = await request(app).get('/api/clubs/1');

            expect(response.statusCode).toBe(200);
            expect(response.body).toHaveProperty('id', '1');
            expect(response.body).toHaveProperty('name', 'Test Club');
            expect(Club.findById).toHaveBeenCalledWith('1');
        });

        test('should return 404 for non-existent club', async () => {
            Club.findById.mockResolvedValueOnce(null);

            const response = await request(app).get('/api/clubs/999');

            expect(response.statusCode).toBe(404);
            expect(response.body).toHaveProperty('error', 'Club not found');
        });
    });

    describe('POST /api/clubs', () => {
        test('should create a new club', async () => {
            // Mock findOne to return null (no existing club)
            Club.findOne.mockResolvedValueOnce(null);

            // Mock User.findById to return a valid admin user
            const mockAdminUser = {
                _id: 'adminId',
                clubsManaged: [],
                save: jest.fn().mockResolvedValue(true)
            };
            User.findById.mockResolvedValueOnce(mockAdminUser);

            const newClubData = {
                name: 'New Club',
                description: 'New Description',
                logo: 'new-logo.jpg',
                adminId: 'adminId'
            };

            const response = await request(app)
                .post('/api/clubs')
                .send(newClubData);

            expect(response.statusCode).toBe(201);
            expect(response.body).toHaveProperty('message', 'Club created.');
            expect(response.body.club).toHaveProperty('name', 'New Club');
            expect(Club.findOne).toHaveBeenCalledWith({ name: /^New Club$/i });
            expect(User.findById).toHaveBeenCalledWith('adminId');
        });

        test('should prevent duplicate club names', async () => {
            const existingClub = {
                _id: 'existingClubId',
                name: 'Existing Club'
            };

            // Mock User.findById to return a valid admin user
            const mockAdminUser = {
                _id: 'adminId',
                clubsManaged: [],
                save: jest.fn().mockResolvedValue(true)
            };
            User.findById.mockResolvedValueOnce(mockAdminUser);

            // Mock findOne to return an existing club with the same name
            Club.findOne.mockResolvedValueOnce(existingClub);

            const response = await request(app)
                .post('/api/clubs')
                .send({
                    name: 'Existing Club',
                    description: 'New Description',
                    logo: 'new-logo.jpg',
                    adminId: 'adminId'
                });

            expect(response.statusCode).toBe(400);
            expect(response.body).toHaveProperty('error', 'Club with this name already exists');
        });
    });

    describe('PUT /api/clubs/:clubId', () => {
        test('should update existing club', async () => {
            const updatedClub = {
                _id: '1',
                name: 'Updated Club',
                description: 'Updated Description',
                logo: 'updated-logo.jpg'
            };
        
            // Mock findOne to return null (no duplicate name)
            Club.findOne.mockResolvedValueOnce(null);
            // Mock findByIdAndUpdate to return the updated club
            Club.findByIdAndUpdate.mockResolvedValueOnce(updatedClub);
        
            const response = await request(app)
                .put('/api/clubs/1')
                .send({
                    name: 'Updated Club',
                    description: 'Updated Description',
                    logo: 'updated-logo.jpg'
                });
        
            expect(response.statusCode).toBe(200);
            expect(response.body).toHaveProperty('message', 'Club updated.');
            expect(response.body.club).toHaveProperty('name', 'Updated Club');
        });

        test('should prevent updating to existing club name', async () => {
            const existingClub = {
                _id: '2', // Different ID than the one we're updating
                name: 'Existing Club'
            };

            // Mock findOne to find an existing club with the same name
            Club.findOne.mockResolvedValueOnce(existingClub);
            
            const response = await request(app)
                .put('/api/clubs/1')  // Different ID than the existing club
                .send({
                    name: 'Existing Club',
                    description: 'Updated Description'
                });

            expect(response.statusCode).toBe(400);
            expect(response.body).toHaveProperty('error', 'Club with this name already exists');
        });
    });

    describe('POST /api/clubs/:clubId/assign-admin', () => {
        // Mock setup
        let mockClub;
        let mockNewAdmin;
        let mockOldAdmin;

        beforeEach(() => {
            jest.clearAllMocks();
            
            // Reset mock objects
            mockClub = {
                _id: 'club1',
                name: 'Test Club',
                admin: 'oldAdminId',
                save: jest.fn().mockResolvedValue(true)
            };
        
            mockNewAdmin = {
                _id: 'newAdminId',
                email: 'newadmin@test.com',
                displayName: 'New Admin',
                clubsManaged: [],
                role: 'Member',
                save: jest.fn().mockResolvedValue(true)
            };
        
            mockOldAdmin = {
                _id: 'oldAdminId',
                clubsManaged: ['club1'],
                role: 'ClubAdmin',
                save: jest.fn().mockResolvedValue(true)
            };

            // Reset mock implementations
            Club.findById.mockReset();
            User.findOne.mockReset();
            User.findById.mockReset();
        });
    
        test('should successfully assign new admin', async () => {
            // Setup mocks
            Club.findById.mockResolvedValue(mockClub);
            User.findOne.mockResolvedValue(mockNewAdmin);
            User.findById.mockResolvedValue(mockOldAdmin);
    
            const response = await request(app)
                .post('/api/clubs/club1/assign-admin')
                .send({ email: 'newadmin@test.com' });
    
            expect(response.statusCode).toBe(200);
            expect(response.body).toHaveProperty('message', 'Club admin updated successfully');
            expect(response.body.club.admin).toEqual({
                id: mockNewAdmin._id,
                email: mockNewAdmin.email,
                displayName: mockNewAdmin.displayName
            });
        });
    
        test('should return 400 if email is not provided', async () => {
            Club.findById.mockResolvedValue(mockClub);
    
            const response = await request(app)
                .post('/api/clubs/club1/assign-admin')
                .send({});
    
            expect(response.statusCode).toBe(400);
            expect(response.body).toHaveProperty('error', 'Valid email is required');
        });

        test('should return 400 for invalid email format', async () => {
            Club.findById.mockResolvedValueOnce(mockClub);
    
            const response = await request(app)
                .post('/api/clubs/club1/assign-admin')
                .send({ email: 'invalid-email' });
    
            expect(response.statusCode).toBe(400);
            expect(response.body).toHaveProperty('error', 'Valid email is required');
        });
    
        test('should return 404 if club not found', async () => {
            Club.findById.mockResolvedValue(null);
    
            const response = await request(app)
                .post('/api/clubs/club1/assign-admin')
                .send({ email: 'newadmin@test.com' });
    
            expect(response.statusCode).toBe(404);
            expect(response.body).toHaveProperty('error', 'Club not found');
        });
    
        test('should return 404 if new admin user not found', async () => {
            Club.findById.mockResolvedValueOnce(mockClub);
            User.findOne.mockResolvedValueOnce(null);
    
            const response = await request(app)
                .post('/api/clubs/club1/assign-admin')
                .send({ email: 'nonexistent@test.com' });
    
            expect(response.statusCode).toBe(404);
            expect(response.body).toHaveProperty('error', 'User with this email not found');
        });
    
        test('should return 400 if user is already admin of the club', async () => {
            const mockExistingAdmin = {
                ...mockNewAdmin,
                _id: mockClub.admin // Same ID as current admin
            };
    
            Club.findById.mockResolvedValueOnce(mockClub);
            User.findOne.mockResolvedValueOnce(mockExistingAdmin);
    
            const response = await request(app)
                .post('/api/clubs/club1/assign-admin')
                .send({ email: 'newadmin@test.com' });
    
            expect(response.statusCode).toBe(400);
            expect(response.body).toHaveProperty('error', 'User is already admin of this club');
        });
    
        test('should handle case when old admin is not found', async () => {
            Club.findById.mockResolvedValueOnce(mockClub);
            User.findOne.mockResolvedValueOnce({ ...mockNewAdmin });
            User.findById.mockResolvedValueOnce(null); // Old admin not found
    
            const response = await request(app)
                .post('/api/clubs/club1/assign-admin')
                .send({ email: 'newadmin@test.com' });
    
            expect(response.statusCode).toBe(200);
            expect(response.body).toHaveProperty('message', 'Club admin updated successfully');
            // Should still update new admin and club
            expect(mockNewAdmin.save).toHaveBeenCalled();
            expect(mockClub.save).toHaveBeenCalled();
        });
    
        test('should update role to Visitor if old admin has no other clubs', async () => {
            const oldAdminWithOneClub = {
                ...mockOldAdmin,
                clubsManaged: ['club1'], // Only managing this club
            };
    
            Club.findById.mockResolvedValueOnce(mockClub);
            User.findOne.mockResolvedValueOnce({ ...mockNewAdmin });
            User.findById.mockResolvedValueOnce(oldAdminWithOneClub);
    
            const response = await request(app)
                .post('/api/clubs/club1/assign-admin')
                .send({ email: 'newadmin@test.com' });
    
            expect(response.statusCode).toBe(200);
            expect(oldAdminWithOneClub.role).toBe('Visitor');
            expect(oldAdminWithOneClub.save).toHaveBeenCalled();
        });

        test('should not downgrade Admin role to Visitor', async () => {
            const oldAdminWithAdminRole = {
                ...mockOldAdmin,
                role: 'Admin', // Admin role should not be downgraded
            };
    
            Club.findById.mockResolvedValueOnce(mockClub);
            User.findOne.mockResolvedValueOnce({ ...mockNewAdmin });
            User.findById.mockResolvedValueOnce(oldAdminWithAdminRole);
    
            const response = await request(app)
                .post('/api/clubs/club1/assign-admin')
                .send({ email: 'newadmin@test.com' });
    
            expect(response.statusCode).toBe(200);
            expect(oldAdminWithAdminRole.role).toBe('Admin'); // Role should remain Admin
            expect(oldAdminWithAdminRole.save).toHaveBeenCalled();
        });
    });
});