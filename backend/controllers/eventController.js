const Event = require('../models/Event');
const Club = require('../models/Club');
const User = require('../models/User');

/**
 * Get all events
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {void}
 */
const getAllEvents = async (req, res) => {
    try {
        const events = await Event.find()
            .populate('club', 'name uuid')
            .sort({ eventStart: 1 });

        res.render('events/event-list', {
            events,
            user: req.user,
            currentPage: 'events'
        });
    } catch (err) {
        res.render('error', {
            message: 'Error fetching events',
            user: req.user,
            currentPage: 'events'
        });
    }
};

/**
 * Get event by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {void}
 */
const getEventById = async (req, res) => {
    try {
        const event = await Event.findOne({ uuid: req.params.eventId })
            .populate('club', 'name uuid')
            .populate('registeredUsers', 'displayName email profileImage');

        if (!event) {
            return res.render('error', {
                message: 'Event not found',
                user: req.user,
                currentPage: 'events'
            });
        }

        // Check if user is registered
        const isRegistered = req.user && event.registeredUsers.some(
            user => user._id.toString() === req.user._id.toString()
        );

        // Check if user is club admin
        const isEventAdmin = req.user && (
            req.user.role === 'Admin' ||
            await Club.findOne({
                _id: event.club._id,
                clubAdmin: req.user._id
            })
        );

        res.render('events/event-details', {
            event,
            isRegistered,
            isEventAdmin,
            user: req.user,
            currentPage: 'events'
        });
    } catch (err) {
        res.render('error', {
            message: 'Error fetching event details',
            user: req.user,
            currentPage: 'events'
        });
    }
};

/**
 * Render create event form
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {void}
 */
const renderCreateEventForm = async (req, res) => {
    try {
        const club = await Club.findOne({ uuid: req.params.clubId });
        if (!club) {
            return res.render('error', {
                message: 'Club not found',
                user: req.user,
                currentPage: 'events'
            });
        }

        res.render('events/create-event', {
            club,
            user: req.user,
            currentPage: 'events'
        });
    } catch (err) {
        res.render('error', {
            message: 'Error loading create event form',
            user: req.user,
            currentPage: 'events'
        });
    }
};

/**
 * Create new event
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {void}
 */
const createEvent = async (req, res) => {
    try {
        const club = await Club.findOne({ uuid: req.params.clubId });
        if (!club) {
            return res.render('events/create-event', {
                error: 'Club not found',
                club: { uuid: req.params.clubId },
                user: req.user,
                currentPage: 'events'
            });
        }

        const event = new Event({
            ...req.body,
            club: club._id,
            seatsRemaining: req.body.seatsAvailable
        });

        await event.save();

        // Add event to club's createdEvents
        club.createdEvents.push(event._id);
        await club.save();

        res.redirect(`/events/${event.uuid}`);
    } catch (err) {
        res.render('events/create-event', {
            error: err.message,
            club: { uuid: req.params.clubId },
            user: req.user,
            currentPage: 'events'
        });
    }
};

/**
 * Render edit event form
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {void}
 */
const renderEditEventForm = async (req, res) => {
    try {
        const event = await Event.findOne({ uuid: req.params.eventId })
            .populate('club', 'name uuid');

        if (!event) {
            return res.render('error', {
                message: 'Event not found',
                user: req.user,
                currentPage: 'events'
            });
        }

        res.render('events/edit-event', {
            event,
            user: req.user,
            currentPage: 'events'
        });
    } catch (err) {
        res.render('error', {
            message: 'Error loading edit form',
            user: req.user,
            currentPage: 'events'
        });
    }
};

/**
 * Update event
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {void}
 */
const updateEvent = async (req, res) => {
    try {
        const existingEvent = await Event.findOne({ uuid: req.params.eventId });
        if (!existingEvent) {
            return res.render('error', {
                message: 'Event not found',
                user: req.user,
                currentPage: 'events'
            });
        }
        
        if (req.body.seatsAvailable < existingEvent.registeredUsers.length) {
            return res.render('events/edit-event', {
                error: 'Cannot reduce seats below number of registered users',
                event: { ...existingEvent.toObject(), ...req.body },
                user: req.user,
                currentPage: 'events'
            });
        }

        // Calculate new seatsRemaining
        const seatsRemaining = req.body.seatsAvailable - existingEvent.registeredUsers.length;

        const event = await Event.findOneAndUpdate(
            { uuid: req.params.eventId },
            { 
                $set: {
                    ...req.body,
                    seatsRemaining
                }
            },
            { new: true, runValidators: true }
        );

        res.redirect(`/events/${event.uuid}`);
    } catch (err) {
        res.render('events/edit-event', {
            error: err.message,
            event: { uuid: req.params.eventId, ...req.body },
            user: req.user,
            currentPage: 'events'
        });
    }
};

/**
 * Register user for event
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {void}
 */
const registerForEvent = async (req, res) => {
    try {
        const event = await Event.findOne({ uuid: req.params.eventId });

        if (!event) {
            return res.status(404).json({ error: 'Event not found' });
        }

        // Check if registration is open
        if (event.status !== 'registration_open') {
            return res.status(400).json({ 
                error: `Registration is not currently open for this event`
            });
        }

        // Check if seats are available
        if (event.seatsRemaining <= 0) {
            return res.status(400).json({ error: 'No seats available' });
        }

        // Check if user is already registered
        if (event.registeredUsers.includes(req.user._id)) {
            return res.status(400).json({ error: 'You are already registered for this event' });
        }

        // Add user to event and update seats
        event.registeredUsers.push(req.user._id);
        event.seatsRemaining--;
        await event.save();

        // Add event to user's eventsJoined
        if (!req.user.eventsJoined.includes(event._id)) {
            req.user.eventsJoined.push(event._id);
            await req.user.save();
        }

        res.json({ message: 'Successfully registered' });
    } catch (err) {
        res.status(500).json({ error: 'Error processing registration' });
    }
};

/**
 * Unregister user from event
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {void}
 */
const unregisterFromEvent = async (req, res) => {
    try {
        const event = await Event.findOne({ uuid: req.params.eventId });

        if (!event) {
            return res.status(404).json({ error: 'Event not found' });
        }

        // Check if registration is open
        if (event.status !== 'registration_open') {
            return res.status(400).json({ 
                error: `Cannot unregister from this event at this time`
            });
        }

        /// Check if user is registered
        if (!event.registeredUsers.includes(req.user._id)) {
            return res.status(400).json({ error: 'You are not registered for this event' });
        }

        // Remove user from event and update seats
        event.registeredUsers = event.registeredUsers.filter(
            userId => userId.toString() !== req.user._id.toString()
        );
        event.seatsRemaining++;
        await event.save();

        // Remove event from user's eventsJoined
        req.user.eventsJoined = req.user.eventsJoined.filter(
            eventId => eventId.toString() !== event._id.toString()
        );
        await req.user.save();

        res.json({ message: 'Successfully unregistered' });
    } catch (err) {
        res.status(500).json({ error: 'Error processing unregistration' });
    }
};

const deleteEvent = async (req, res) => {
    try {
        const event = await Event.findOne({ uuid: req.params.eventId });
        if (!event) {
            return res.render('error', {
                message: 'Event not found',
                user: req.user,
                currentPage: 'events'
            });
        }

        // Remove event from club's createdEvents
        await Club.findByIdAndUpdate(event.club, {
            $pull: { createdEvents: event._id }
        });

        // Remove event from all users' eventsJoined
        await User.updateMany(
            { eventsJoined: event._id },
            { $pull: { eventsJoined: event._id } }
        );

        // Delete the event
        await Event.deleteOne({ _id: event._id });

        res.redirect('/events');
    } catch (err) {
        res.render('error', {
            message: 'Error deleting event',
            user: req.user,
            currentPage: 'events'
        });
    }
};

module.exports = {
    getAllEvents,
    getEventById,
    renderCreateEventForm,
    createEvent,
    renderEditEventForm,
    updateEvent,
    registerForEvent,
    unregisterFromEvent,
    deleteEvent
};