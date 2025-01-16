const userService = require('../services/userService');
const User = require('../models/User');
const mongoose = require('mongoose');

jest.mock('../models/User');

describe('userService.changeRole', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('should throw error when userId is not provided', async () => {
        await expect(userService.changeRole(null, 'Admin'))
            .rejects
            .toThrow('userId is required');
    });

    test('should throw error when role is not provided', async () => {
        await expect(userService.changeRole('validUserId', null))
            .rejects
            .toThrow('role is required');
    });

    test('should throw error when role is invalid', async () => {
        await expect(userService.changeRole('validUserId', 'InvalidRole'))
            .rejects
            .toThrow('Invalid role: InvalidRole');
    });

    test('should throw error when user is not found', async () => {
        User.findById.mockResolvedValueOnce(null);
        
        await expect(userService.changeRole('nonexistentId', 'Admin'))
            .rejects
            .toThrow('User not Found');
    });

    test.each(['Admin', 'ClubAdmin', 'Member', 'Visitor'])(
        'should successfully change role to %s',
        async (role) => {
            const mockUser = {
                _id: 'userId',
                role: 'Member',
                save: jest.fn().mockResolvedValue({
                    toObject: { _id: 'userId', role }
                })
            };

            User.findById.mockResolvedValueOnce(mockUser);

            const result = await userService.changeRole('userId', role);
            expect(mockUser.save).toHaveBeenCalled();
            expect(result).toEqual({ _id: 'userId', role });
        }
    );
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
            clubsJoined: [],
            save: jest.fn().mockResolvedValue({
                toObject: { _id: 'userId', clubsJoined: ['clubId'] }
            })
        };

        User.findById.mockResolvedValueOnce(mockUser);

        const result = await userService.joinClub('userId', 'clubId');
        expect(mockUser.save).toHaveBeenCalled();
        expect(result).toEqual({ _id: 'userId', clubsJoined: ['clubId'] });
    });

    test('should throw error when user is not found', async () => {
        User.findById.mockResolvedValueOnce(null);

        await expect(userService.joinClub('userId', 'clubId'))
            .rejects
            .toThrow('User not Found');
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
        const clubId = 'clubId';
        const mockUser = {
            _id: 'userId',
            clubsJoined: [clubId],
            save: jest.fn().mockReturnValue({
                populate: jest.fn().mockResolvedValue({
                    lean: jest.fn().mockResolvedValue({
                        _id: 'userId',
                        clubsJoined: []
                    })
                })
            })
        };

        User.findById.mockResolvedValueOnce(mockUser);

        const result = await userService.leaveClub('userId', clubId);
        expect(result).toEqual({
            _id: 'userId',
            clubsJoined: []
        });
        expect(mockUser.clubsJoined).not.toContain(clubId);
    });

    test('should throw error when user has no clubs', async () => {
        const mockUser = {
            _id: 'userId',
            clubsJoined: null
        };

        User.findById.mockResolvedValueOnce(mockUser);

        await expect(userService.leaveClub('userId', 'clubId'))
            .rejects
            .toThrow('User is not a Member of Any Club');
    });

    test('should throw error when user is not in the specified club', async () => {
        const mockUser = {
            _id: 'userId',
            clubsJoined: ['otherClubId']
        };

        User.findById.mockResolvedValueOnce(mockUser);

        await expect(userService.leaveClub('userId', 'clubId'))
            .rejects
            .toThrow('User is not a Member of this Club');
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