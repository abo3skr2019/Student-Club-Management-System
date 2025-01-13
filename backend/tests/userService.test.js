const userService = require('../services/userService');
const User = require('../models/User');
const mongoose = require('mongoose');

jest.mock('../models/User');

describe('userService.ChangeRole', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('should throw error when userId is not provided', async () => {
        await expect(userService.ChangeRole(null, 'Admin'))
            .rejects
            .toThrow('userId is required');
    });

    test('should throw error when role is not provided', async () => {
        await expect(userService.ChangeRole('validUserId', null))
            .rejects
            .toThrow('role is required');
    });

    test('should throw error when role is invalid', async () => {
        await expect(userService.ChangeRole('validUserId', 'InvalidRole'))
            .rejects
            .toThrow('Invalid role');
    });

    test.each(['Admin', 'ClubAdmin', 'Member', 'Visitor'])(
        'should successfully change role to %s',
        async (role) => {
            const mockUser = { _id: 'userId', role: 'Member' };
            const updatedUser = { ...mockUser, role };

            User.findByIdAndUpdate.mockResolvedValueOnce(updatedUser);

            const result = await userService.ChangeRole('userId', role);

            expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
                'userId',
                { $set: { role } },
                { new: true }
            );
            expect(result).toEqual(updatedUser);
        }
    );

    test('should handle database errors', async () => {
        const dbError = new Error('Database error');
        User.findByIdAndUpdate.mockRejectedValueOnce(dbError);

        await expect(userService.ChangeRole('userId', 'Admin'))
            .rejects
            .toThrow(dbError);
    });

    test('should handle invalid user ID format', async () => {
        const invalidId = 'invalid-id-format';
        const dbError = new mongoose.Error.CastError('ObjectId', invalidId, 'ObjectId');
        User.findByIdAndUpdate.mockRejectedValueOnce(dbError);

        await expect(userService.ChangeRole(invalidId, 'Admin'))
            .rejects
            .toThrow(dbError);
    });
});
describe('userService.findById', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('should find user by id successfully', async () => {
        const mockUser = { _id: 'userId', name: 'Test User' };
        User.findById.mockReturnValue({
            lean: jest.fn().mockResolvedValueOnce(mockUser)
        });

        const result = await userService.findById('userId');
        expect(result).toEqual(mockUser);
    });

    test('should throw error when userId is not provided', async () => {
        await expect(userService.findById(null))
            .rejects
            .toThrow('userId is required');
    });

    test('should handle database errors', async () => {
        const dbError = new Error('Database error');
        User.findById.mockReturnValue({
            lean: jest.fn().mockRejectedValueOnce(dbError)
        });

        await expect(userService.findById('userId'))
            .rejects
            .toThrow(dbError);
    });
});

describe('userService.findByUUID', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('should find user by UUID successfully', async () => {
        const mockUser = { uuid: 'test-uuid', name: 'Test User' };
        User.findOne.mockReturnValue({
            lean: jest.fn().mockResolvedValueOnce(mockUser)
        });

        const result = await userService.findByUUID('test-uuid');
        expect(result).toEqual(mockUser);
    });

    test('should throw error when UUID is not provided', async () => {
        await expect(userService.findByUUID(null))
            .rejects
            .toThrow('UUID is required');
    });
});

describe('userService.findByEmail', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('should find user by email successfully', async () => {
        const mockUser = { email: 'test@test.com', name: 'Test User' };
        User.findOne.mockReturnValue({
            lean: jest.fn().mockResolvedValueOnce(mockUser)
        });

        const result = await userService.findByEmail('test@test.com');
        expect(result).toEqual(mockUser);
    });

    test('should throw error when email is not provided', async () => {
        await expect(userService.findByEmail(null))
            .rejects
            .toThrow('Email is required');
    });
});

describe('userService.updateProfile', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('should update profile successfully', async () => {
        const mockUser = { _id: 'userId', name: 'Updated Name' };
        const updateData = { name: 'Updated Name' };
        
        User.findByIdAndUpdate.mockResolvedValueOnce(mockUser);

        const result = await userService.updateProfile('userId', updateData);
        expect(result).toEqual(mockUser);
        expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
            'userId',
            { $set: updateData },
            { new: true, runValidators: true }
        );
    });

    test('should throw error when userId is not provided', async () => {
        await expect(userService.updateProfile(null, {}))
            .rejects
            .toThrow('userId is required');
    });

    test('should throw error when updateData is not provided', async () => {
        await expect(userService.updateProfile('userId', null))
            .rejects
            .toThrow('updateData is required');
    });
});

describe('userService.joinClub', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('should join club successfully', async () => {
        const mockUser = { 
            _id: 'userId', 
            clubsJoined: ['clubId']
        };
        
        User.findByIdAndUpdate.mockReturnValue({
            populate: jest.fn().mockResolvedValueOnce(mockUser)
        });

        const result = await userService.joinClub('userId', 'clubId');
        expect(result).toEqual(mockUser);
        expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
            'userId',
            { $addToSet: { clubsJoined: 'clubId' } },
            { new: true }
        );
    });

    test('should throw error when userId is not provided', async () => {
        await expect(userService.joinClub(null, 'clubId'))
            .rejects
            .toThrow('userId is required');
    });

    test('should throw error when clubId is not provided', async () => {
        await expect(userService.joinClub('userId', null))
            .rejects
            .toThrow('clubId is required');
    });
});

describe('userService.leaveClub', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('should leave club successfully', async () => {
        const mockUser = { 
            _id: 'userId', 
            clubsJoined: []
        };
        
        User.findByIdAndUpdate.mockReturnValue({
            populate: jest.fn().mockResolvedValueOnce(mockUser)
        });

        const result = await userService.leaveClub('userId', 'clubId');
        expect(result).toEqual(mockUser);
        expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
            'userId',
            { $pull: { clubsJoined: 'clubId' } },
            { new: true }
        );
    });

    test('should throw error when userId is not provided', async () => {
        await expect(userService.leaveClub(null, 'clubId'))
            .rejects
            .toThrow('userId is required');
    });

    test('should throw error when clubId is not provided', async () => {
        await expect(userService.leaveClub('userId', null))
            .rejects
            .toThrow('clubId is required');
    });
});