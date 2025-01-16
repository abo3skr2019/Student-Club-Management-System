const userService = require('../services/userService');
const Club = require('../models/Club');
const User = require('../models/User');
const mongoose = require('mongoose');

jest.mock('../models/Club');
jest.mock('../models/User');

describe('userService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('findById', () => {
    it('should find user by id', async () => {
      const mockUser = { _id: '123', name: 'Test User' };
      User.findById.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            lean: jest.fn().mockResolvedValue(mockUser)
          })
        })
      });

      const result = await userService.findById('123');
      expect(result).toEqual(mockUser);
      expect(User.findById).toHaveBeenCalledWith('123');
    });

    it('should throw error if userId is not provided', async () => {
      await expect(userService.findById()).rejects.toThrow('userId is required');
    });
  });

  describe('findByUUID', () => {
    it('should find user by UUID', async () => {
      const mockUser = { uuid: 'test-uuid', name: 'Test User' };
      User.findOne.mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockUser)
      });

      const result = await userService.findByUUID('test-uuid');
      expect(result).toEqual(mockUser);
      expect(User.findOne).toHaveBeenCalledWith({ uuid: 'test-uuid' });
    });

    it('should throw error if UUID is not provided', async () => {
      await expect(userService.findByUUID()).rejects.toThrow('UUID is required');
    });
  });

  describe('findByEmail', () => {
    it('should find user by email', async () => {
      const mockUser = { email: 'test@test.com', name: 'Test User' };
      User.findOne.mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockUser)
      });

      const result = await userService.findByEmail('test@test.com');
      expect(result).toEqual(mockUser);
    });

    it('should throw error if email is not provided', async () => {
      await expect(userService.findByEmail()).rejects.toThrow('Email is required');
    });
  });

  describe('findByRole', () => {
    it('should find users by role', async () => {
      const mockUsers = [{ role: 'Admin' }, { role: 'Admin' }];
      User.find.mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockUsers)
      });

      const result = await userService.findByRole('Admin');
      expect(result).toEqual(mockUsers);
    });

    it('should throw error if role is not provided', async () => {
      await expect(userService.findByRole()).rejects.toThrow('Role is required');
    });
  });

  describe('updateProfile', () => {
    it('should update user profile', async () => {
      const mockUser = { _id: '123', firstName: 'John', lastName: 'Doe' };
      User.findByIdAndUpdate.mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockUser)
      });

      const result = await userService.updateProfile('123', { 
        firstName: 'John',
        lastName: 'Doe'
      });
      expect(result).toEqual(mockUser);
    });

    it('should throw error if user not found', async () => {
      User.findByIdAndUpdate.mockReturnValue({
        lean: jest.fn().mockResolvedValue(null)
      });
      await expect(userService.updateProfile('123', { firstName: 'John' })).rejects.toThrow('User not Found');
    });
  });

  describe('changeRole', () => {
    it('should change user role', async () => {
      const mockUser = { 
        _id: '123', 
        role: 'Member',
        save: jest.fn().mockResolvedValue({ _id: '123', role: 'Admin' })
      };
      User.findById.mockResolvedValue(mockUser);

      const result = await userService.changeRole('123', 'Admin');
      expect(result.role).toBe('Admin');
    });

    it('should throw error for invalid role', async () => {
      await expect(userService.changeRole('123', 'InvalidRole')).rejects.toThrow('Invalid role');
    });
  });

  describe('joinClub', () => {
    it('should add user to club', async () => {
      const mockUser = {
        _id: '123',
        clubsJoined: [],
        save: jest.fn().mockResolvedValue({ _id: '123', clubsJoined: ['456'] })
      };
      const mockClub = { _id: '456' };
      
      User.findById.mockResolvedValue(mockUser);
      Club.findById.mockResolvedValue(mockClub);

      const result = await userService.joinClub('123', '456');
      expect(result.clubsJoined).toContain('456');
    });

    it('should throw error if club not found', async () => {
      User.findById.mockResolvedValue({ _id: '123' });
      Club.findById.mockResolvedValue(null);
      
      await expect(userService.joinClub('123', '456')).rejects.toThrow('Club not Found');
    });
  });

  describe('leaveClub', () => {
    it('should remove user from club', async () => {
      const mockUser = {
        _id: '123',
        clubsJoined: ['456'],
        save: jest.fn().mockResolvedValue({
          _id: '123',
          clubsJoined: [],
          populate: jest.fn().mockResolvedValue({
            lean: jest.fn().mockResolvedValue({ _id: '123', clubsJoined: [] })
          })
        })
      };
      
      User.findById.mockResolvedValue(mockUser);

      const result = await userService.leaveClub('123', '456');
      expect(result.clubsJoined).toHaveLength(0);
    });

    it('should throw error if user is not a member of the club', async () => {
      const mockUser = {
        _id: '123',
        clubsJoined: ['789']
      };
      
      User.findById.mockResolvedValue(mockUser);
      
      await expect(userService.leaveClub('123', '456')).rejects.toThrow('User is not a Member of this Club');
    });
  });

  describe('findByClubsJoined', () => {
    it('should find users by club joined', async () => {
      const mockUsers = [{ clubsJoined: ['123'] }];
      User.find.mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockUsers)
      });

      const result = await userService.findByClubsJoined('123');
      expect(result).toEqual(mockUsers);
    });

    it('should throw error if clubId is not provided', async () => {
      await expect(userService.findByClubsJoined()).rejects.toThrow('clubId is required');
    });
  });

  describe('findByClubsManaged', () => {
    it('should find users by clubs managed', async () => {
      const mockUsers = [{ clubsManaged: ['123'] }];
      User.find.mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockUsers)
      });

      const result = await userService.findByClubsManaged('123');
      expect(result).toEqual(mockUsers);
    });

    it('should throw error if clubId is not provided', async () => {
      await expect(userService.findByClubsManaged()).rejects.toThrow('clubId is required');
    });
  });

  describe('findByEventsJoined', () => {
    it('should throw not implemented error', async () => {
      await expect(userService.findByEventsJoined('123')).rejects.toThrow('Events are not implemented yet');
    });
  });

  describe('findUserEvents', () => {
    it('should throw not implemented error', async () => {
      await expect(userService.findUserEvents('123')).rejects.toThrow('Events are not implemented yet');
    });
  });
});
