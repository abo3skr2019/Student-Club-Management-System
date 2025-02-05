const Event = require('../models/Event');
const Club = require('../models/Club');
const User = require('../models/User');
const { updateEventStatus } = require('../../utils/eventScheduler');

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
        console.error(error);
        throw error;
    }
};

/**
 * Find event by UUID
 * @param {String} uuid Event UUID
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
        throw error;
    }
};

/**
 * Create new event
 * @param {Object} eventData Pre-validated event data
 * @param {String} clubId Club UUID
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

        // Set initial status
        await updateEventStatus(event.uuid);

        return event;
    } catch (error) {
        throw error;
    }
};

/**
 * Update event
 * @param {String} eventId Event UUID
 * @param {Object} updateData Pre-validated update data
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

        const updatedEvent = await Event.findOneAndUpdate(
            { uuid: eventId },
            { 
                $set: {
                    ...updateData,
                    seatsRemaining
                }
            },
            { new: true, runValidators: true }
        );

        await updateEventStatus(eventId);

        return updatedEvent;
    } catch (error) {
        throw error;
    }
};

/**
 * Register user for event
 * @param {String} eventId Event UUID
 * @param {String} userId User ID
 * @returns {Promise<Object>} Updated event
 */
const registerUser = async (eventId, userId) => {
    try {
        const user = await User.findById(userId);
        if (!user) {
            throw new Error('User not found');
        }
        
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

        if (event.registeredUsers.includes(userId)) {
            throw new Error('User is already registered for this event');
        }

        event.registeredUsers.push(userId);
        event.seatsRemaining--;
        await event.save();

        if (!user.eventsJoined.includes(event._id)) {
            user.eventsJoined.push(event._id);
            await user.save();
        }

        return event;
    } catch (error) {
        throw error;
    }
};

/**
 * Unregister user from event
 * @param {String} eventId Event UUID
 * @param {String} userId User ID
 * @returns {Promise<Object>} Updated event
 */
const unregisterUser = async (eventId, userId) => {
    try {
        const user = await User.findById(userId);
        if (!user) {
            throw new Error('User not found');
        }

        const event = await Event.findOne({ uuid: eventId });
        if (!event) {
            throw new Error('Event not found');
        }

        if (event.status !== 'registration_open') {
            throw new Error('Cannot unregister from this event at this time');
        }

        // Ensure comparison with string representations
        const userIdString = userId.toString();
        const registeredUserIds = event.registeredUsers.map(id => id.toString());

        if (!registeredUserIds.includes(userIdString)) {
            throw new Error('User is not registered for this event');
        }

        // Filter using string comparison
        event.registeredUsers = event.registeredUsers.filter(
            id => id.toString() !== userIdString
        );
        event.seatsRemaining++;
        await event.save();

        user.eventsJoined = user.eventsJoined.filter(
            eventId => eventId.toString() !== event._id.toString()
        );
        await user.save();

        return event;
    } catch (error) {
        throw error;
    }
};

/**
 * Delete event
 * @param {String} eventId Event UUID
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
        throw error;
    }
};

/**
 * Check if user is admin for event
 * @param {Object} user User object
 * @param {Object} event Event object
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
        throw error;
    }
};

/**
 * Find club by UUID
 * @param {String} clubId Club UUID
 * @returns {Promise<Object>} Club object
 */
const findClubByUUID = async (clubId) => {
    try {
        return await Club.findOne({ uuid: clubId });
    } catch (error) {
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