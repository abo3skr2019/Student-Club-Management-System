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