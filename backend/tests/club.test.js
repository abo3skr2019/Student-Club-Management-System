const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');

const Club = require('../models/Club');
const User = require('../models/User');
const clubController = require('../controllers/clubController');


// Club model mock
jest.mock('../models/Club', () => {
    class MockClub {
        constructor(data) {
            Object.assign(this, data);
            this.uuid = 'club123-uuid';
            this._id = 'club123';
        }

        save() {
            return Promise.resolve(this);
        }
    }

    MockClub.find = jest.fn();
    MockClub.findOne = jest.fn();
    MockClub.findOneAndUpdate = jest.fn();

    return MockClub;
});

// Mock the User model
jest.mock('../models/User', () => ({
    findById: jest.fn(),
    findOne: jest.fn(),
}));

describe('Club Controller', () => {
    let req, res;

    beforeEach(() => {
        req = {
            user: { 
                _id: 'user123', 
                id: 'user123', 
                role: 'Admin',
                clubsManaged: [],
                save: jest.fn().mockResolvedValue(true)
            },
            body: { name: 'Club 1', description: 'Desc 1', logo: 'logo1.jpg' },
            params: { clubId: 'club123-uuid' }
        };
        res = {
            render: jest.fn(),
            redirect: jest.fn(),
            status: jest.fn().mockReturnThis(),
            send: jest.fn()
        };
        jest.clearAllMocks();
    });

    describe('getAllClubs', () => {
        test('should render index view with all clubs', async () => {
            const mockClubs = [
                { _id: '1', uuid: 'club1-uuid', name: 'Club 1', description: 'Desc 1', logo: 'logo1.jpg' },
                { _id: '2', uuid: 'club2-uuid', name: 'Club 2', description: 'Desc 2', logo: 'logo2.jpg' }
            ];

            // Mock populate chain
            Club.find.mockReturnValue({
                populate: jest.fn().mockResolvedValue(mockClubs)
            });

            await clubController.getAllClubs(req, res);

            expect(Club.find).toHaveBeenCalled();
            expect(res.render).toHaveBeenCalledWith('clubs/club-list', {
                clubs: mockClubs,
                user: req.user
            });
        });

        test('should render error view when fetching clubs fails', async () => {
            Club.find.mockReturnValue({
                populate: jest.fn().mockRejectedValue(new Error('Database error'))
            });

            await clubController.getAllClubs(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.render).toHaveBeenCalledWith('error', {
                message: 'Error fetching clubs',
                user: req.user
            });
        });
    });

    describe('getClubById', () => {
        test('should render detail view with specific club', async () => {
            const mockClub = {
                _id: '1',
                uuid: 'club123-uuid',
                name: 'Test Club',
                description: 'Test Description',
                logo: 'test-logo.jpg'
            };

            // Mock populate chain
            Club.findOne.mockReturnValue({
                populate: jest.fn().mockImplementation(() => ({
                    populate: jest.fn().mockResolvedValue(mockClub)
                }))
            });

            await clubController.getClubById(req, res);

            expect(Club.findOne).toHaveBeenCalledWith({ uuid: 'club123-uuid' });
            expect(res.render).toHaveBeenCalledWith('clubs/club-details', {
                club: mockClub,
                user: req.user
            });
        });

        test('should render error view for non-existent club', async () => {
            Club.findOne.mockReturnValue({
                populate: jest.fn().mockImplementation(() => ({
                    populate: jest.fn().mockResolvedValue(null)
                }))
            });

            await clubController.getClubById(req, res);

            expect(Club.findOne).toHaveBeenCalledWith({ uuid: 'club123-uuid' });
            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.render).toHaveBeenCalledWith('error', {
                message: 'Club not found',
                user: req.user
            });
        });

        test('should render error view when fetching club fails', async () => {
            Club.findOne.mockReturnValue({
                populate: jest.fn().mockImplementation(() => ({
                    populate: jest.fn().mockRejectedValue(new Error('Database error'))
                }))
            });

            await clubController.getClubById(req, res);

            expect(Club.findOne).toHaveBeenCalledWith({ uuid: 'club123-uuid' });
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.render).toHaveBeenCalledWith('error', {
                message: 'Error fetching club details',
                user: req.user
            });
        });
    });

    describe('renderCreateClubForm', () => {
        test('should render create club form', async () => {
            await clubController.renderCreateClubForm(req, res);
            
            expect(res.render).toHaveBeenCalledWith('clubs/create-club', {
                user: req.user
            });
        });
    });

    describe('createClub', () => {
        test('should create new club and redirect to club detail', async () => {
            // Mock that no existing club is found with the same name
            Club.findOne.mockResolvedValue(null);

            await clubController.createClub(req, res);

            // Verify club creation
            expect(Club.findOne).toHaveBeenCalledWith({ 
                name: new RegExp(`^${req.body.name}$`, 'i') 
            });

            // Verify redirect to new club's detail page
            expect(res.redirect).toHaveBeenCalledWith('/clubs/club123-uuid');

            // Verify user's clubsManaged was updated
            expect(req.user.clubsManaged).toContain('club123');
            expect(req.user.save).toHaveBeenCalled();
        });

        test('should render create form with error for duplicate club name', async () => {
            const existingClub = {
                _id: 'existing123',
                uuid: 'existing123-uuid',
                name: 'Club 1'
            };

            // Mock finding existing club with same name
            Club.findOne.mockResolvedValue(existingClub);

            await clubController.createClub(req, res);

            // Verify error rendering
            expect(res.render).toHaveBeenCalledWith('clubs/create-club', {
                error: 'Club with this name already exists',
                user: req.user
            });
        });

        test('should render create form with error on save failure', async () => {
            // Mock no existing club
            Club.findOne.mockResolvedValue(null);

            // Mock save failure
            req.user.save.mockRejectedValue(new Error('Save failed'));

            await clubController.createClub(req, res);

            // Verify error rendering
            expect(res.render).toHaveBeenCalledWith('clubs/create-club', {
                error: 'Save failed',
                user: req.user
            });
        });
    });
    describe('renderUpdateClubForm', () => {
        test('should render update-club template with club data', async () => {
            const mockClub = {
                _id: 'club123',
                uuid: 'club123-uuid',
                name: 'Club 1',
                description: 'Desc 1',
                logo: 'logo1.jpg'
            };

            Club.findOne.mockResolvedValue(mockClub);

            await clubController.renderEditClubForm(req, res);

            expect(Club.findOne).toHaveBeenCalledWith({ uuid: 'club123-uuid' });
            expect(res.render).toHaveBeenCalledWith('clubs/update-club', {
                club: mockClub,
                user: req.user
            });
        });

        test('should render error when club not found', async () => {
            Club.findOne.mockResolvedValue(null);

            await clubController.renderEditClubForm(req, res);

            expect(Club.findOne).toHaveBeenCalledWith({ uuid: 'club123-uuid' });
            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.render).toHaveBeenCalledWith('error', {
                message: 'Club not found',
                user: req.user
            });
        });
    });

    describe('updateClub', () => {
        test('should update existing club then redirect to /clubs/detail', async () => {
            const updatedClub = {
                _id: 'club123',
                uuid: 'club123-uuid',
                name: 'Club 1',
                description: 'Desc 1',
                logo: 'logo1.jpg'
            };

            Club.findOneAndUpdate.mockResolvedValue(updatedClub);
            Club.findOne.mockResolvedValue(null);

            await clubController.updateClub(req, res);

            expect(Club.findOneAndUpdate).toHaveBeenCalledWith(
                { uuid: 'club123-uuid' },
                { $set: { name: 'Club 1', description: 'Desc 1', logo: 'logo1.jpg' } },
                { new: true, runValidators: true }
            );
            expect(res.redirect).toHaveBeenCalledWith('/clubs/club123-uuid');
        });

        test('should prevent updating to existing club name', async () => {
            const existingClub = {
                _id: 'different-id',
                uuid: 'different-uuid',
                name: 'Club 1'
            };

            // Mock findOne to find an existing club with the same name
            Club.findOne.mockResolvedValue(existingClub);
            
            await clubController.updateClub(req, res);

            expect(res.render).toHaveBeenCalledWith('clubs/update-club', {
                club: { uuid: 'club123-uuid', ...req.body },
                error: 'Club with this name already exists',
                user: req.user
            });
        });

        test('should render error when club not found', async () => {
            Club.findOne.mockResolvedValue(null);
            Club.findOneAndUpdate.mockResolvedValue(null);
            
            await clubController.updateClub(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.render).toHaveBeenCalledWith('error', {
                message: 'Club not found',
                user: req.user
            });
        });
    });

    describe('renderAssignClubAdmin', () => {
        test('should render assign-admin template with club data', async () => {
            const mockClub = {
                _id: 'club123',
                uuid: 'club123-uuid',
                name: 'Club 1',
                description: 'Desc 1',
                logo: 'logo1.jpg'
            };
    
            // Mock populate chain
            Club.findOne.mockReturnValue({
                populate: jest.fn().mockReturnThis(),
                populate: jest.fn().mockResolvedValue(mockClub)
            });
    
            await clubController.renderAssignClubAdmin(req, res);
    
            expect(Club.findOne).toHaveBeenCalledWith({ uuid: 'club123-uuid' });
            expect(res.render).toHaveBeenCalledWith('clubs/assign-admin', {
                club: mockClub,
                user: req.user
            });
        });
    
        test('should render error when club not found', async () => {
            Club.findOne.mockReturnValue({
                populate: jest.fn().mockReturnThis(),
                populate: jest.fn().mockResolvedValue(null)
            });
    
            await clubController.renderAssignClubAdmin(req, res);
    
            expect(Club.findOne).toHaveBeenCalledWith({ uuid: 'club123-uuid' });
            expect(res.render).toHaveBeenCalledWith('error', {
                message: 'Club not found',
                user: req.user
            });
        });
    });

    describe('assignClubAdmin', () => {
        beforeEach(() => {
            req = {
                user: { 
                    _id: 'user123', 
                    id: 'user123', 
                    role: 'Admin',
                    clubsManaged: [],
                    save: jest.fn().mockResolvedValue(true)
                },
                body: { email: 'newadmin@test.com' },
                params: { clubId: 'club123-uuid' }
            };
            res = {
                render: jest.fn(),
                redirect: jest.fn(),
                status: jest.fn().mockReturnThis(),
                send: jest.fn()
            };
            jest.clearAllMocks();
        });
    
        test('should assign new admin and redirect to club detail', async () => {
            const mockClub = {
                _id: 'club123',
                uuid: 'club123-uuid',
                name: 'Test Club',
                clubAdmin: 'oldAdminId',
                save: jest.fn().mockResolvedValue(true)
            };
    
            const mockNewAdmin = {
                _id: 'newAdminId',
                email: 'newadmin@test.com',
                displayName: 'New Admin',
                clubsManaged: [],
                role: 'Member',
                save: jest.fn().mockResolvedValue(true)
            };
    
            const mockOldAdmin = {
                _id: 'oldAdminId',
                clubsManaged: ['club123'],
                role: 'ClubAdmin',
                save: jest.fn().mockResolvedValue(true)
            };

            Club.findOne.mockResolvedValue(mockClub);
            User.findOne.mockResolvedValue(mockNewAdmin);
            User.findById.mockResolvedValue(mockOldAdmin);
    
            await clubController.assignClubAdmin(req, res);

            expect(res.redirect).toHaveBeenCalledWith('/clubs/club123-uuid');
        });
    
        test('should render error view for invalid email', async () => {
            req.body = {};
            await clubController.assignClubAdmin(req, res);

            expect(res.render).toHaveBeenCalledWith('error', {
                message: 'Email not valid',
                user: req.user
            });
        });

        test('should render error view for invalid email format', async () => {
            req.body.email = 'invalid-email';
            await clubController.assignClubAdmin(req, res);

            expect(res.render).toHaveBeenCalledWith('error', {
                message: 'Email not valid',
                user: req.user
            });
        });
    
        test('should render error view when club not found', async () => {
            Club.findOne.mockResolvedValue(null);
            await clubController.assignClubAdmin(req, res);

            expect(Club.findOne).toHaveBeenCalledWith({ uuid: 'club123-uuid' });
            expect(res.render).toHaveBeenCalledWith('error', {
                message: 'Club not found',
                user: req.user
            });
        });
    
        test('should render assign-admin view with error when user not found', async () => {
            const mockClub = {
                _id: 'club123',
                uuid: 'club123-uuid',
                name: 'Test Club'
            };
            Club.findOne.mockResolvedValue(mockClub);
            User.findOne.mockResolvedValue(null);
    
            await clubController.assignClubAdmin(req, res);
    
            expect(res.render).toHaveBeenCalledWith('clubs/assign-admin', {
                club: mockClub,
                error: 'User with this email not found',
                user: req.user
            });
        });
    
        test('should render assign-admin view when user is already admin', async () => {
            const mockClub = {
                _id: 'club123',
                uuid: 'club123-uuid',
                clubAdmin: 'adminId'
            };
    
            const mockExistingAdmin = {
                _id: 'adminId',
                email: 'newadmin@test.com'
            };
    
            Club.findOne.mockResolvedValue(mockClub);
            User.findOne.mockResolvedValue(mockExistingAdmin);
    
            await clubController.assignClubAdmin(req, res);
    
            expect(res.render).toHaveBeenCalledWith('clubs/assign-admin', {
                club: mockClub,
                error: 'User is already an admin of this club',
                user: req.user
            });
        });
    
        test('should handle missing old admin gracefully', async () => {
            const mockClub = {
                _id: 'club123',
                uuid: 'club123-uuid',
                clubAdmin: 'oldAdminId',
                save: jest.fn().mockResolvedValue(true)
            };
        
            const mockNewAdmin = {
                _id: 'newAdminId',
                email: 'newadmin@test.com',
                clubsManaged: [],
                role: 'Member',
                save: jest.fn().mockResolvedValue(true)
            };
        
            Club.findOne.mockResolvedValue(mockClub);
            User.findOne.mockResolvedValue(mockNewAdmin);
            User.findById.mockResolvedValue(null);
        
            await clubController.assignClubAdmin(req, res);
        
            expect(mockNewAdmin.save).toHaveBeenCalled();
            expect(mockClub.save).toHaveBeenCalled();
            expect(res.redirect).toHaveBeenCalledWith('/clubs/club123-uuid');
        });
    
        test('should update role to Visitor for old admin with no other clubs', async () => {
            const mockClub = {
                _id: 'club123',
                uuid: 'club123-uuid',
                clubAdmin: 'oldAdminId',
                save: jest.fn().mockResolvedValue(true)
            };
        
            const mockOldAdmin = {
                _id: 'oldAdminId',
                clubsManaged: ['club123'],
                role: 'ClubAdmin',
                save: jest.fn().mockResolvedValue(true)
            };
        
            const mockNewAdmin = {
                _id: 'newAdminId',
                email: 'newadmin@test.com',
                clubsManaged: [],
                role: 'Member',
                save: jest.fn().mockResolvedValue(true)
            };
        
            Club.findOne.mockResolvedValue(mockClub);
            User.findOne.mockResolvedValue(mockNewAdmin);
            User.findById.mockResolvedValue(mockOldAdmin);
        
            await clubController.assignClubAdmin(req, res);
        
            expect(mockOldAdmin.role).toBe('Visitor');
            expect(mockOldAdmin.save).toHaveBeenCalled();
            expect(res.redirect).toHaveBeenCalledWith('/clubs/club123-uuid');
        });

        test('should preserve Admin role during reassignment', async () => {
            const mockClub = {
                _id: 'club123',
                uuid: 'club123-uuid',
                clubAdmin: 'oldAdminId',
                save: jest.fn().mockResolvedValue(true)
            };
        
            const mockOldAdmin = {
                _id: 'oldAdminId',
                role: 'Admin',
                clubsManaged: ['club123'],
                save: jest.fn().mockResolvedValue(true)
            };
        
            const mockNewAdmin = {
                _id: 'newAdminId',
                email: 'newadmin@test.com',
                clubsManaged: [],
                role: 'Member',
                save: jest.fn().mockResolvedValue(true)
            };
        
            Club.findOne.mockResolvedValue(mockClub);
            User.findOne.mockResolvedValue(mockNewAdmin);
            User.findById.mockResolvedValue(mockOldAdmin);
        
            await clubController.assignClubAdmin(req, res);
        
            expect(mockOldAdmin.role).toBe('Admin');
            expect(res.redirect).toHaveBeenCalledWith('/clubs/club123-uuid');
        });
    });
});