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
describe('findById', () => {
  test('should find club by ID', async () => {
    const mockClub = { _id: new mongoose.Types.ObjectId() };
    Club.findById.mockReturnValue({
      lean: jest.fn().mockResolvedValue(mockClub)
    });

    const result = await clubService.findById(mockClub._id);
    expect(result).toEqual(mockClub);
  });

  test('should throw error if clubId not provided', async () => {
    await expect(clubService.findById()).rejects.toThrow('clubId is required');
  });
});

describe('findByUUID', () => {
  test('should find club by UUID', async () => {
    const mockClub = { uuid: 'test-uuid' };
    Club.findOne.mockReturnValue({
      lean: jest.fn().mockResolvedValue(mockClub)
    });

    const result = await clubService.findByUUID('test-uuid');
    expect(result).toEqual(mockClub);
  });

  test('should throw error if UUID not provided', async () => {
    await expect(clubService.findByUUID()).rejects.toThrow('UUID is required');
  });
});

describe('findByName', () => {
  test('should find club by name', async () => {
    const mockClub = { name: 'Test Club' };
    Club.findOne.mockReturnValue({
      lean: jest.fn().mockResolvedValue(mockClub)
    });

    const result = await clubService.findByName('Test Club');
    expect(result).toEqual(mockClub);
  });

  test('should throw error if name not provided', async () => {
    await expect(clubService.findByName()).rejects.toThrow('name is required');
  });
});

describe('findByAdmin', () => {
  test('should find clubs by admin ID', async () => {
    const adminId = new mongoose.Types.ObjectId();
    const mockClubs = [{ clubAdmin: adminId }];
    Club.find.mockResolvedValue(mockClubs);

    const result = await clubService.findByAdmin(adminId);
    expect(result).toEqual(mockClubs);
  });

  test('should throw error if adminId not provided', async () => {
    await expect(clubService.findByAdmin()).rejects.toThrow('adminId is required');
  });
});

describe('getAllClubs', () => {
  test('should return all clubs', async () => {
    const mockClubs = [{ name: 'Club 1' }, { name: 'Club 2' }];
    Club.find.mockReturnValue({
      populate: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockClubs)
      })
    });

    const result = await clubService.getAllClubs();
    expect(result).toEqual(mockClubs);
  });
});

describe('createClub', () => {
  test('should create new club', async () => {
    const clubData = {
      name: 'New Club',
      description: 'Test Description',
      logo: 'logo.png',
      clubAdmin: new mongoose.Types.ObjectId()
    };
    const mockClub = { ...clubData };
    Club.mockImplementation(() => ({
      save: jest.fn().mockResolvedValue(mockClub)
    }));

    const result = await clubService.createClub(clubData);
    expect(result).toEqual(mockClub);
  });

  test('should throw error if required fields missing', async () => {
    const clubData = { name: 'New Club' };
    await expect(clubService.createClub(clubData)).rejects.toThrow('description is required');
  });
});

describe('updateClub', () => {
  test('should update club', async () => {
    const clubId = new mongoose.Types.ObjectId();
    const updateData = { name: 'Updated Club' };
    const mockUpdatedClub = { _id: clubId, ...updateData };
    Club.findByIdAndUpdate.mockResolvedValue(mockUpdatedClub);

    const result = await clubService.updateClub(clubId, updateData);
    expect(result).toEqual(mockUpdatedClub);
  });

  test('should throw error if clubId not provided', async () => {
    await expect(clubService.updateClub()).rejects.toThrow('clubId is required');
  });
});

describe('deleteClub', () => {
  test('should delete club', async () => {
    const clubId = new mongoose.Types.ObjectId();
    const mockDeletedClub = { _id: clubId };
    Club.findByIdAndDelete.mockResolvedValue(mockDeletedClub);

    const result = await clubService.deleteClub(clubId);
    expect(result).toEqual(mockDeletedClub);
  });

  test('should throw error if clubId not provided', async () => {
    await expect(clubService.deleteClub()).rejects.toThrow('clubId is required');
  });
});