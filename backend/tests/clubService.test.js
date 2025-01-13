const clubService = require('../services/clubService');
const Club = require('../models/Club');
const User = require('../models/User');
const mongoose = require('mongoose');

jest.mock('../models/Club');
jest.mock('../models/User');

describe('updateClubAdmin', () => {
  let mockClub, mockOldAdmin, mockNewAdmin;
  const clubId = new mongoose.Types.ObjectId();
  const oldAdminId = new mongoose.Types.ObjectId();
  const newAdminId = new mongoose.Types.ObjectId();

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockClub = {
      _id: clubId,
      clubAdmin: oldAdminId,
      save: jest.fn().mockResolvedValue({ _id: clubId })
    };

    mockOldAdmin = {
      _id: oldAdminId,
      role: 'ClubAdmin',
      clubsManaged: [clubId],
      save: jest.fn().mockResolvedValue({})
    };

    mockNewAdmin = {
      _id: newAdminId,
      role: 'Member',
      clubsManaged: [],
      save: jest.fn().mockResolvedValue({})
    };

    Club.findById = jest.fn().mockResolvedValue(mockClub);
    User.findById = jest.fn().mockImplementation((id) => {
      if (id.equals(oldAdminId)) return Promise.resolve(mockOldAdmin);
      if (id.equals(newAdminId)) return Promise.resolve(mockNewAdmin);
      return Promise.resolve(null);
    });
  });

  test('should successfully update club admin', async () => {
    const result = await clubService.updateClubAdmin(clubId, newAdminId);

    expect(Club.findById).toHaveBeenCalledWith(clubId);
    expect(User.findById).toHaveBeenCalledWith(newAdminId);
    expect(mockNewAdmin.role).toBe('ClubAdmin');
    expect(mockNewAdmin.clubsManaged).toContain(clubId);
    expect(mockOldAdmin.clubsManaged).not.toContain(clubId);
    expect(result).toBeDefined();
  });

  test('should change old admin role to Member when no clubs left', async () => {
    mockOldAdmin.clubsManaged = [clubId];
    
    await clubService.updateClubAdmin(clubId, newAdminId);

    expect(mockOldAdmin.role).toBe('Member');
    expect(mockOldAdmin.save).toHaveBeenCalled();
  });

  test('should not change old admin role if managing other clubs', async () => {
    const otherClubId = new mongoose.Types.ObjectId();
    mockOldAdmin.clubsManaged = [clubId, otherClubId];
    
    await clubService.updateClubAdmin(clubId, newAdminId);

    expect(mockOldAdmin.role).toBe('ClubAdmin');
  });

  test('should throw error if club not found', async () => {
    Club.findById.mockResolvedValue(null);

    await expect(clubService.updateClubAdmin(clubId, newAdminId))
      .rejects
      .toThrow('Club not found');
  });

  test('should throw error if new admin not found', async () => {
    User.findById = jest.fn().mockResolvedValue(null);

    await expect(clubService.updateClubAdmin(clubId, newAdminId))
      .rejects
      .toThrow('New admin not found');
  });

  test('should throw error if user is already admin', async () => {
    mockClub.clubAdmin = newAdminId;

    await expect(clubService.updateClubAdmin(clubId, newAdminId))
      .rejects
      .toThrow('User is already this club\'s admin');
  });

  test('should handle missing old admin gracefully', async () => {
    User.findById = jest.fn().mockImplementation((id) => {
      if (id.equals(newAdminId)) return Promise.resolve(mockNewAdmin);
      return Promise.resolve(null);
    });

    const result = await clubService.updateClubAdmin(clubId, newAdminId);

    expect(result).toBeDefined();
    expect(mockNewAdmin.role).toBe('ClubAdmin');
  });

  test('should not change role if new admin is already ClubAdmin', async () => {
    mockNewAdmin.role = 'ClubAdmin';
    
    await clubService.updateClubAdmin(clubId, newAdminId);

    expect(mockNewAdmin.role).toBe('ClubAdmin');
  });
});