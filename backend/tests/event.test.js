const Event = require('../models/Event');
const Club = require('../models/Club');
const User = require('../models/User');
const eventService = require('../services/eventService');

// Mock the models
jest.mock('../models/Event');
jest.mock('../models/Club');
jest.mock('../models/User');

describe('Event Service', () => {
    let mockEvent, mockClub, mockUser;

    beforeEach(() => {
        jest.clearAllMocks();
        
        // Setup mock data
        mockEvent = {
            _id: 'event123',
            uuid: 'event-uuid-123',
            name: 'Test Event',
            club: 'club123',
            registeredUsers: [],
            seatsAvailable: 100,
            seatsRemaining: 100,
            status: 'registration_open',
            save: jest.fn().mockResolvedValue(true)
        };

        mockClub = {
            _id: 'club123',
            uuid: 'club-uuid-123',
            name: 'Test Club',
            createdEvents: [],
            save: jest.fn().mockResolvedValue(true)
        };

        mockUser = {
            _id: 'user123',
            eventsJoined: [],
            save: jest.fn().mockResolvedValue(true)
        };

        User.findById.mockResolvedValue(mockUser);
    });

    describe('getAllEvents', () => {
        test('should return all events with populated fields', async () => {
            const mockEvents = [mockEvent];
            // Mock the chain of query builder methods
            Event.find.mockReturnValue({
                populate: jest.fn().mockReturnThis(),
                sort: jest.fn().mockReturnThis(),
                lean: jest.fn().mockResolvedValue(mockEvents)
            });

            const result = await eventService.getAllEvents();
            
            expect(Event.find).toHaveBeenCalled();
            expect(result).toEqual(mockEvents);
        });

        test('should throw error if database operation fails', async () => {
            Event.find.mockImplementation(() => {
                throw new Error('Database error');
            });

            await expect(eventService.getAllEvents()).rejects.toThrow('Database error');
        });
    });

    describe('findByUUID', () => {
        test('should return event by UUID with populated fields', async () => {
            Event.findOne.mockReturnValue({
                populate: jest.fn().mockReturnThis(),
                lean: jest.fn().mockResolvedValue(mockEvent)
            });

            const result = await eventService.findByUUID('event-uuid-123');
            
            expect(Event.findOne).toHaveBeenCalledWith({ uuid: 'event-uuid-123' });
            expect(result).toEqual(mockEvent);
        });

        test('should throw error if UUID is not provided', async () => {
            await expect(eventService.findByUUID()).rejects.toThrow('UUID is required');
        });
    });

    describe('createEvent', () => {
        const eventData = {
            name: 'New Event',
            description: 'Test Description',
            seatsAvailable: 100
        };

        test('should create new event and update club', async () => {
            Club.findOne.mockResolvedValue(mockClub);
            const saveSpy = jest.spyOn(Event.prototype, 'save')
                .mockResolvedValue({ ...eventData, _id: 'new-event-123' });

            await eventService.createEvent(eventData, 'club-uuid-123');

            expect(Club.findOne).toHaveBeenCalledWith({ uuid: 'club-uuid-123' });
            expect(saveSpy).toHaveBeenCalled();
            expect(mockClub.save).toHaveBeenCalled();
        });

        test('should throw error if club not found', async () => {
            Club.findOne.mockResolvedValue(null);

            await expect(eventService.createEvent(eventData, 'invalid-club'))
                .rejects.toThrow('Club not found');
        });
    });

    describe('updateEvent', () => {
        const updateData = {
            name: 'Updated Event',
            description: 'Updated Description',
            seatsAvailable: 150
        };

        test('should update event successfully', async () => {
            Event.findOne.mockResolvedValue(mockEvent);
            Event.findOneAndUpdate.mockResolvedValue({ ...mockEvent, ...updateData });

            const result = await eventService.updateEvent('event-uuid-123', updateData);

            expect(Event.findOneAndUpdate).toHaveBeenCalledWith(
                { uuid: 'event-uuid-123' },
                { $set: expect.objectContaining(updateData) },
                { new: true, runValidators: true }
            );
            expect(result).toMatchObject(updateData);
        });

        test('should throw error when reducing seats below registered users', async () => {
            mockEvent.registeredUsers = Array(50).fill('user');
            Event.findOne.mockResolvedValue(mockEvent);

            await expect(eventService.updateEvent('event-uuid-123', { seatsAvailable: 40 }))
                .rejects.toThrow('Cannot reduce seats below number of registered users');
        });
    });

    describe('registerUser', () => {
        test('should register user for event successfully', async () => {
            User.findById.mockResolvedValue(mockUser);
            Event.findOne.mockResolvedValue(mockEvent);
            
            await eventService.registerUser('event-uuid-123', 'user123');

            expect(mockEvent.registeredUsers).toContain('user123');
            expect(mockEvent.seatsRemaining).toBe(99);
            expect(mockEvent.save).toHaveBeenCalled();
            expect(mockUser.save).toHaveBeenCalled();
        });

        test('should throw error if event is full', async () => {
            mockEvent.seatsRemaining = 0;
            User.findById.mockResolvedValue(mockUser);
            Event.findOne.mockResolvedValue(mockEvent);

            await expect(eventService.registerUser('event-uuid-123', 'user123'))
                .rejects.toThrow('No seats available');
        });

        test('should throw error if registration is closed', async () => {
            mockEvent.status = 'registration_closed';
            User.findById.mockResolvedValue(mockUser);
            Event.findOne.mockResolvedValue(mockEvent);

            await expect(eventService.registerUser('event-uuid-123', 'user123'))
                .rejects.toThrow('Registration is not currently open for this event');
        });

        test('should throw error if user is already registered', async () => {
            mockEvent.registeredUsers = ['user123'];
            User.findById.mockResolvedValue(mockUser);
            Event.findOne.mockResolvedValue(mockEvent);

            await expect(eventService.registerUser('event-uuid-123', 'user123'))
                .rejects.toThrow('User is already registered for this event');
        });

        test('should throw error if event not found', async () => {
            User.findById.mockResolvedValue(mockUser);
            Event.findOne.mockResolvedValue(null);

            await expect(eventService.registerUser('event-uuid-123', 'user123'))
                .rejects.toThrow('Event not found');
        });

        test('should throw error if user not found', async () => {
            User.findById.mockResolvedValue(null);

            await expect(eventService.registerUser('event-uuid-123', 'user123'))
                .rejects.toThrow('User not found');
        });
    });

    describe('unregisterUser', () => {
        beforeEach(() => {
            mockEvent.registeredUsers = ['user123'];
            mockEvent.seatsRemaining = 99;
            mockUser.eventsJoined = ['event123'];
        });

        test('should unregister user from event successfully', async () => {
            User.findById.mockResolvedValue(mockUser);
            Event.findOne.mockResolvedValue(mockEvent);
            
            await eventService.unregisterUser('event-uuid-123', 'user123');
    
            expect(mockEvent.registeredUsers).not.toContain('user123');
            expect(mockEvent.seatsRemaining).toBe(100);
            expect(mockEvent.save).toHaveBeenCalled();
            expect(mockUser.save).toHaveBeenCalled();
        });

        test('should throw error if user not found', async () => {
            User.findById.mockResolvedValue(null);
    
            await expect(eventService.unregisterUser('event-uuid-123', 'user123'))
                .rejects.toThrow('User not found');
            
            expect(Event.findOne).not.toHaveBeenCalled();
        });

        test('should throw error if event not found', async () => {
            User.findById.mockResolvedValue(mockUser);
            Event.findOne.mockResolvedValue(null);
    
            await expect(eventService.unregisterUser('event-uuid-123', 'user123'))
                .rejects.toThrow('Event not found');
        });

        test('should throw error if user is not registered', async () => {
            mockEvent.registeredUsers = ['other-user'];
            User.findById.mockResolvedValue(mockUser);
            Event.findOne.mockResolvedValue(mockEvent);
    
            await expect(eventService.unregisterUser('event-uuid-123', 'user123'))
                .rejects.toThrow('User is not registered for this event');
        });

        test('should throw error if registration is closed', async () => {
            mockEvent.status = 'registration_closed';
            User.findById.mockResolvedValue(mockUser);
            Event.findOne.mockResolvedValue(mockEvent);
    
            await expect(eventService.unregisterUser('event-uuid-123', 'user123'))
                .rejects.toThrow('Cannot unregister from this event at this time');
        });

        test('should throw error if event is ongoing', async () => {
            mockEvent.status = 'ongoing';
            User.findById.mockResolvedValue(mockUser);
            Event.findOne.mockResolvedValue(mockEvent);
    
            await expect(eventService.unregisterUser('event-uuid-123', 'user123'))
                .rejects.toThrow('Cannot unregister from this event at this time');
        });

        test('should throw error if event is completed', async () => {
            mockEvent.status = 'completed';
            User.findById.mockResolvedValue(mockUser);
            Event.findOne.mockResolvedValue(mockEvent);
    
            await expect(eventService.unregisterUser('event-uuid-123', 'user123'))
                .rejects.toThrow('Cannot unregister from this event at this time');
        });
    });

    describe('deleteEvent', () => {
        test('should delete event and update related models', async () => {
            Event.findOne.mockResolvedValue(mockEvent);
            Club.findByIdAndUpdate.mockResolvedValue(true);
            User.updateMany.mockResolvedValue(true);
            Event.deleteOne.mockResolvedValue(true);

            await eventService.deleteEvent('event-uuid-123');

            expect(Club.findByIdAndUpdate).toHaveBeenCalledWith(
                mockEvent.club,
                { $pull: { createdEvents: mockEvent._id } }
            );
            expect(User.updateMany).toHaveBeenCalledWith(
                { eventsJoined: mockEvent._id },
                { $pull: { eventsJoined: mockEvent._id } }
            );
            expect(Event.deleteOne).toHaveBeenCalledWith({ _id: mockEvent._id });
        });

        test('should throw error if event not found', async () => {
            Event.findOne.mockResolvedValue(null);

            await expect(eventService.deleteEvent('invalid-uuid'))
                .rejects.toThrow('Event not found');
        });
    });

    describe('isUserEventAdmin', () => {
        test('should return true for site admin', async () => {
            mockUser.role = 'Admin';
            const result = await eventService.isUserEventAdmin(mockUser, mockEvent);
            expect(result).toBe(true);
        });

        test('should return true for club admin', async () => {
            mockUser.role = 'ClubAdmin';
            Club.findOne.mockResolvedValue(mockClub);

            const result = await eventService.isUserEventAdmin(mockUser, mockEvent);
            expect(result).toBe(true);
        });

        test('should return false for non-admin user', async () => {
            mockUser.role = 'Member';
            Club.findOne.mockResolvedValue(null);

            const result = await eventService.isUserEventAdmin(mockUser, mockEvent);
            expect(result).toBe(false);
        });
    });
});