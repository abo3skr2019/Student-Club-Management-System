const profileController = require('../controllers/profileController');
const User = require('../models/User');



jest.mock('../models/User');

describe('profileController', () => {
    let req, res;

    beforeEach(() => {
        req = {
            user: { id: 'user123' },
            body: { firstName: 'John', lastName: 'Doe' }
        };
        res = {
            render: jest.fn(),
            redirect: jest.fn(),
            status: jest.fn().mockReturnThis(),
            send: jest.fn()
        };
        jest.clearAllMocks();
    });

    describe('renderUpdateProfileForm', () => {
        test('should render update-profile template with user data', () => {
            profileController.renderUpdateProfileForm(req, res);
            expect(res.render).toHaveBeenCalledWith('update-profile', { user: req.user });
        });
    });

    describe('updateProfile', () => {
        test('should update and save user, then redirect to /profile', async () => {
            const mockUser = {
                firstName: 'Old',
                lastName: 'Name',
                save: jest.fn()
            };
            User.findById.mockResolvedValue(mockUser);
            await profileController.updateProfile(req, res);
            expect(User.findById).toHaveBeenCalledWith('user123');
            expect(mockUser.firstName).toBe('John');
            expect(mockUser.lastName).toBe('Doe');
            expect(mockUser.save).toHaveBeenCalled();
            expect(res.redirect).toHaveBeenCalledWith('/profile');
        });

        test('should handle errors and redirect to /update-profile', async () => {
            User.findById.mockRejectedValue(new Error('DB Error'));
            await profileController.updateProfile(req, res);
            expect(res.redirect).toHaveBeenCalledWith('/update-profile');
        });
    });

    describe('renderProfile', () => {
        test('should render profile with user data', async () => {
            User.findById.mockResolvedValue({ firstName: 'Test', lastName: 'User' });
            await profileController.renderProfile(req, res);
            expect(res.render).toHaveBeenCalledWith('profile', { user: { firstName: 'Test', lastName: 'User' } });
        });

        test('should return 404 if user not found', async () => {
            User.findById.mockResolvedValue(null);
            await profileController.renderProfile(req, res);
            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.send).toHaveBeenCalledWith('User not found');
        });

        test('should handle errors and return 500', async () => {
            User.findById.mockRejectedValue(new Error('DB Error'));
            await profileController.renderProfile(req, res);
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.send).toHaveBeenCalledWith('Server error');
        });
    });
});
