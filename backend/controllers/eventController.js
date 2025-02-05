const Event = require('../models/Event');
const User = require('../models/User');
const eventService = require('../services/eventService');

/** 
 * Get all events
 * @param {Request} req The request object
 * @param {Response} res The response object
 * @returns {void}
 */
const getAllEvents = async (req, res) => {
    try {
        const events = await eventService.getAllEvents();
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
 * @param {Request} req The request object
 * @param {Response} res The response object
 * @returns {void}
 */
const getEventById = async (req, res) => {
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

        // Get admin status
        const isEventAdmin = await eventService.isUserEventAdmin(req.user, event);

        let registeredUsersData = [];
        if (isEventAdmin) {
            const registeredUsers = await User.find(
                { 'eventsJoined.event': event._id },
                'displayName email profileImage eventsJoined'
            );
            
            registeredUsersData = registeredUsers.map(user => ({
                user: {
                    displayName: user.displayName,
                    email: user.email,
                    profileImage: user.profileImage
                },
                registrationDate: user.eventsJoined.find(
                    e => e.event.toString() === event._id.toString()
                ).registrationDate
            }));
        }
        
        // Get registration status
        const isRegistered = req.user && req.user.eventsJoined.some(
            reg => reg.event.toString() === event._id.toString()
        );

        res.render('events/event-details', {
            event,
            isRegistered,
            isEventAdmin,
            registeredUsersData,
            user: req.user,
            currentPage: 'events'
        });
    } catch (err) {
        console.log(err);
        res.render('error', {
            message: 'Error fetching event details',
            user: req.user,
            currentPage: 'events'
        });
    }
};

/** 
 * Render create event form
 * @param {Request} req The request object
 * @param {Response} res The response object
 * @returns {void}
 */
const renderCreateEventForm = async (req, res) => {
    try {
        const club = await eventService.findClubByUUID(req.params.clubId);
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
            HeaderOrSidebar: 'sidebar',
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
 * @param {Request} req The request object
 * @param {Response} res The response object
 * @returns {void}
 */
const createEvent = async (req, res) => {
    try {
        const event = await eventService.createEvent(req.body, req.params.clubId);
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
 * @param {Request} req The request object
 * @param {Response} res The response object
 * @returns {void}
 */
const renderEditEventForm = async (req, res) => {
    try {
        const event = await eventService.findByUUID(req.params.eventId);
        
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
 * @param {Request} req The request object
 * @param {Response} res The response object
 * @returns {void}
 */
const updateEvent = async (req, res) => {
    try {
        const event = await eventService.updateEvent(req.params.eventId, req.body);
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
 * Register for event
 * @param {Request} req The request object
 * @param {Response} res The response object
 * @returns {void}
 */
const registerForEvent = async (req, res) => {
    try {
        await eventService.registerUser(req.params.eventId, req.user._id);
        res.json({ message: 'Successfully registered' });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

/** 
 * Unregister from event
 * @param {Request} req The request object
 * @param {Response} res The response object
 * @returns {void}
 */
const unregisterFromEvent = async (req, res) => {
    try {
        await eventService.unregisterUser(req.params.eventId, req.user._id);
        res.json({ message: 'Successfully unregistered' });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

/** 
 * Delete event
 * @param {Request} req The request object
 * @param {Response} res The response object
 * @returns {void}
 */
const deleteEvent = async (req, res) => {
    try {
        await eventService.deleteEvent(req.params.eventId);
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