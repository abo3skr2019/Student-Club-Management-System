const Event = require('../models/Event');
const Club = require('../models/Club');
const User = require('../models/User');

/**
 * Find all events
 * @returns {Promise<Array>} Array of Event objects
 */
const getAllEvents = async () => {
    try {
        return await Event.find()
            .populate('club', 'name uuid')
            .sort({ eventStart: 1 })
            .lean();
    } catch (error) {
        console.error('Error in eventService.getAllEvents: ', error);
        throw error;
    }
};

/**
 * Find event by UUID
 * @param {String} uuid - Event UUID
 * @returns {Promise<Object>} Event object
 */
const findByUUID = async (uuid) => {
    try {
        if (!uuid) {
            throw new Error('UUID is required');
        }
        return await Event.findOne({ uuid })
            .populate('club', 'name uuid')
            .populate('registeredUsers', 'displayName email profileImage')
            .lean();
    } catch (error) {
        console.error('Error in eventService.findByUUID: ', error);
        throw error;
    }
};

/**
 * Create new event
 * @param {Object} eventData - Event data
 * @param {String} clubId - Club UUID
 * @returns {Promise<Object>} Created event
 */
const createEvent = async (eventData, clubId) => {
    try {
        const club = await Club.findOne({ uuid: clubId });
        if (!club) {
            throw new Error('Club not found');
        }

        const event = new Event({
            ...eventData,
            club: club._id,
            seatsRemaining: eventData.seatsAvailable
        });

        await event.save();

        // Add event to club's createdEvents
        club.createdEvents.push(event._id);
        await club.save();

        return event;
    } catch (error) {
        console.error('Error in eventService.createEvent: ', error);
        throw error;
    }
};

/**
 * Update event
 * @param {String} eventId - Event UUID
 * @param {Object} updateData - Updated event data
 * @returns {Promise<Object>} Updated event
 */
const updateEvent = async (eventId, updateData) => {
    try {
        const existingEvent = await Event.findOne({ uuid: eventId });
        if (!existingEvent) {
            throw new Error('Event not found');
        }

        if (updateData.seatsAvailable < existingEvent.registeredUsers.length) {
            throw new Error('Cannot reduce seats below number of registered users');
        }

        // Calculate new seatsRemaining
        const seatsRemaining = updateData.seatsAvailable - existingEvent.registeredUsers.length;

        return await Event.findOneAndUpdate(
            { uuid: eventId },
            { 
                $set: {
                    ...updateData,
                    seatsRemaining
                }
            },
            { new: true, runValidators: true }
        );
    } catch (error) {
        console.error('Error in eventService.updateEvent: ', error);
        throw error;
    }
};

/**
 * Register user for event
 * @param {String} eventId - Event UUID
 * @param {Object} user - User object
 * @returns {Promise<Object>} Updated event
 */
const registerUser = async (eventId, user) => {
    try {
        const event = await Event.findOne({ uuid: eventId });
        if (!event) {
            throw new Error('Event not found');
        }

        if (event.status !== 'registration_open') {
            throw new Error('Registration is not currently open for this event');
        }

        if (event.seatsRemaining <= 0) {
            throw new Error('No seats available');
        }

        if (event.registeredUsers.includes(user._id)) {
            throw new Error('User is already registered for this event');
        }

        event.registeredUsers.push(user._id);
        event.seatsRemaining--;
        await event.save();

        if (!user.eventsJoined.includes(event._id)) {
            user.eventsJoined.push(event._id);
            await user.save();
        }

        return event;
    } catch (error) {
        console.error('Error in eventService.registerUser: ', error);
        throw error;
    }
};

/**
 * Unregister user from event
 * @param {String} eventId - Event UUID
 * @param {Object} user - User object
 * @returns {Promise<Object>} Updated event
 */
const unregisterUser = async (eventId, user) => {
    try {
        const event = await Event.findOne({ uuid: eventId });
        if (!event) {
            throw new Error('Event not found');
        }

        if (event.status !== 'registration_open') {
            throw new Error('Cannot unregister from this event at this time');
        }

        if (!event.registeredUsers.includes(user._id)) {
            throw new Error('User is not registered for this event');
        }

        event.registeredUsers = event.registeredUsers.filter(
            userId => userId.toString() !== user._id.toString()
        );
        event.seatsRemaining++;
        await event.save();

        user.eventsJoined = user.eventsJoined.filter(
            eventId => eventId.toString() !== event._id.toString()
        );
        await user.save();

        return event;
    } catch (error) {
        console.error('Error in eventService.unregisterUser: ', error);
        throw error;
    }
};

/**
 * Delete event
 * @param {String} eventId - Event UUID
 * @returns {Promise<void>}
 */
const deleteEvent = async (eventId) => {
    try {
        const event = await Event.findOne({ uuid: eventId });
        if (!event) {
            throw new Error('Event not found');
        }

        await Club.findByIdAndUpdate(event.club, {
            $pull: { createdEvents: event._id }
        });

        await User.updateMany(
            { eventsJoined: event._id },
            { $pull: { eventsJoined: event._id } }
        );

        await Event.deleteOne({ _id: event._id });
    } catch (error) {
        console.error('Error in eventService.deleteEvent: ', error);
        throw error;
    }
};

/**
 * Check if user is admin for event
 * @param {Object} user - User object 
 * @param {Object} event - Event object
 * @returns {Promise<boolean>} Is admin
 */
const isUserEventAdmin = async (user, event) => {
    try {
        if (!user || !event) return false;
        if (user.role === 'Admin') return true;
        
        const isClubAdmin = await Club.findOne({
            _id: event.club._id,
            clubAdmin: user._id
        });
        
        return !!isClubAdmin;
    } catch (error) {
        console.error('Error in eventService.isUserEventAdmin: ', error);
        throw error;
    }
};

/**
 * Find club by UUID
 * @param {String} clubId - Club UUID
 * @returns {Promise<Object>} Club object
 */
const findClubByUUID = async (clubId) => {
    try {
        return await Club.findOne({ uuid: clubId });
    } catch (error) {
        console.error('Error in eventService.findClubByUUID: ', error);
        throw error;
    }
};

module.exports = {
    getAllEvents,
    findByUUID,
    createEvent,
    updateEvent,
    registerUser,
    unregisterUser,
    deleteEvent,
    isUserEventAdmin,
    findClubByUUID
};