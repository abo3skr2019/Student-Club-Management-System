const eventService = require('../services/eventService');
const { z } = require('zod');

/**
 * Get all events
 * @param {Request} req The request object
 * @param {Response} res The response object
 * @returns {void}
 */
const getAllEvents = async (req, res) => {
    try {
        const events = await eventService.getAllEvents();
        res.json({
            success: true,
            data: events
        });
    } catch (error) {
        console.error('Error in getAllEvents:', error);
        res.status(500).json({
            success: false,
            error: 'Error fetching events'
        });
    }
};

/**
 * Get event by UUID
 * @param {Request} req The request object
 * @param {Response} res The response object
 * @returns {void}
 */
const getEventByUUID = async (req, res) => {
    try {
        const { uuid } = req.params;
        const eventData = await eventService.findByUUID(uuid);
        res.json({
            success: true,
            data: eventData
        });
    } catch (error) {
        console.error('Error in getEventByUUID:', error);
        if (error.message === 'Invalid UUID format') {
            return res.status(400).json({ success: false, error: error.message });
        }
        if (error.message === 'Event not found') {
            return res.status(404).json({ success: false, error: error.message });
        }
        res.status(500).json({ success: false, error: 'Failed to fetch event' });
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
        const { eventId } = req.params;
        const eventData = await eventService.findByUUID(eventId);

        // Get registration status
        const isRegistered =
            req.user &&
            eventData.registeredUsers.some(
                (reg) => reg.user.uuid === req.user.uuid,
            );

        // Check if user is admin for UI purposes
        const isEventAdmin =
            req.user &&
            (req.user.globalRole === 'inmaAdmin' ||
                eventData.club.memberships.some(
                    (m) =>
                        m.userId === req.user.id &&
                        ['clubAdmin', 'hr'].includes(m.role),
                ));

        res.json({
            success: true,
            data: {
                event: eventData,
                isRegistered,
                isEventAdmin,
                registeredUsersData: eventData.registeredUsers.map((reg) => ({
                    user: reg.user,
                    registrationDate: reg.registrationDate,
                }))
            }
        });
    } catch (error) {
        console.error('Error in getEventById:', error);
        res.status(error.message === 'Event not found' ? 404 : 500).json({
            success: false,
            error: error.message || 'Error fetching event details'
        });
    }
};

/**
 * Get club for event creation
 * @param {Request} req The request object
 * @param {Response} res The response object
 * @returns {void}
 */
const getClubForEventCreation = async (req, res) => {
    try {
        const club = await eventService.findClubByUUID(req.params.clubId);
        if (!club) {
            return res.status(404).json({
                success: false,
                error: 'Club not found'
            });
        }

        res.json({
            success: true,
            data: { club }
        });
    } catch (error) {
        console.error('Error in getClubForEventCreation:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Error loading club data'
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
        // Convert form data to proper types
        const eventData = {
            ...req.body,
            seatsAvailable: parseInt(req.body.seatsAvailable),
            registrationStart: new Date(req.body.registrationStart),
            registrationEnd: new Date(req.body.registrationEnd),
            eventStart: new Date(req.body.eventStart),
            eventEnd: new Date(req.body.eventEnd),
        };

        const event = await eventService.createEvent(
            eventData,
            req.params.clubId,
        );
        res.status(201).json({
            success: true,
            data: event
        });
    } catch (err) {
        res.status(400).json({
            success: false,
            error: err.message,
            clubId: req.params.clubId
        });
    }
};

/**
 * Get event for editing
 * @param {Request} req The request object
 * @param {Response} res The response object
 * @returns {void}
 */
const getEventForEditing = async (req, res) => {
    try {
        const eventData = await eventService.findByUUID(req.params.eventId);

        if (!eventData) {
            return res.status(404).json({
                success: false,
                error: 'Event not found'
            });
        }

        res.json({
            success: true,
            data: { event: eventData }
        });
    } catch (error) {
        console.error('Error in getEventForEditing:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Error loading event data'
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
        // Convert form data to proper types
        const updateData = {
            ...req.body,
            seatsAvailable: parseInt(req.body.seatsAvailable),
            registrationStart: new Date(req.body.registrationStart),
            registrationEnd: new Date(req.body.registrationEnd),
            eventStart: new Date(req.body.eventStart),
            eventEnd: new Date(req.body.eventEnd),
        };

        const event = await eventService.updateEvent(
            req.params.eventId,
            updateData,
        );
        res.json({
            success: true,
            data: event
        });
    } catch (err) {
        res.status(400).json({
            success: false,
            error: err.message,
            eventId: req.params.eventId
        });
    }
};

/**
 * Register user for event
 * @param {Request} req The request object
 * @param {Response} res The response object
 * @returns {void}
 */
const registerForEvent = async (req, res) => {
    try {
        const eventId = req.params.eventId;
        const userId = req.user.id;

        const eventData = await eventService.registerUser(eventId, userId);
        res.json({
            success: true,
            data: eventData
        });
    } catch (error) {
        console.error('Error in registerForEvent:', error);
        if (error.message === 'Event not found') {
            return res.status(404).json({ success: false, error: error.message });
        }
        if (
            error.message === 'User is already registered for this event' ||
            error.message === 'No seats available' ||
            error.message === 'Registration is not currently open for this event'
        ) {
            return res.status(400).json({ success: false, error: error.message });
        }
        res.status(500).json({ success: false, error: 'Failed to register user for event' });
    }
};

/**
 * Unregister user from event
 * @param {Request} req The request object
 * @param {Response} res The response object
 * @returns {void}
 */
const unregisterFromEvent = async (req, res) => {
    try {
        const eventId = req.params.eventId;
        const userId = req.user.id;

        const eventData = await eventService.unregisterUser(eventId, userId);
        res.json({
            success: true,
            data: eventData
        });
    } catch (error) {
        console.error('Error in unregisterFromEvent:', error);
        if (error.message === 'Event not found') {
            return res.status(404).json({ success: false, error: error.message });
        }
        if (
            error.message === 'User is not registered for this event' ||
            error.message === 'Cannot unregister from this event at this time'
        ) {
            return res.status(400).json({ success: false, error: error.message });
        }
        res.status(500).json({ success: false, error: 'Failed to unregister user from event' });
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
        const { eventId } = req.params;
        await eventService.deleteEvent(eventId);
        res.status(204).send();
    } catch (error) {
        console.error('Error in deleteEvent:', error);
        if (error.message === 'Event not found') {
            return res.status(404).json({ success: false, error: error.message });
        }
        res.status(500).json({ success: false, error: 'Failed to delete event' });
    }
};

/**
 * Create event API endpoint
 * @param {Request} req The request object
 * @param {Response} res The response object
 * @returns {void}
 */
const createEventApi = async (req, res) => {
    try {
        // Get user ID from header for API authentication in non-production environments
        // In production, req.user would be populated by passport
        const userId = req.user ? req.user.id : parseInt(req.headers['x-user-id']);
        
        if (!userId) {
            return res.status(401).json({ 
                success: false, 
                error: 'Authentication required. Please provide x-user-id header.' 
            });
        }
        
        // Extract club ID from request body
        const { clubId } = req.body;
        
        if (!clubId) {
            return res.status(400).json({ 
                success: false, 
                error: 'Club ID is required' 
            });
        }
        
        // Prepare event data with proper type conversions
        const eventData = {
            ...req.body,
            seatsAvailable: parseInt(req.body.seatsAvailable),
            createdBy: userId,
            updatedBy: userId,
            registrationStart: new Date(req.body.registrationStart),
            registrationEnd: new Date(req.body.registrationEnd),
            eventStart: new Date(req.body.eventStart),
            eventEnd: new Date(req.body.eventEnd),
        };
        
        // Remove clubId from eventData as it's passed separately
        delete eventData.clubId;
        
        const event = await eventService.createEvent(eventData, clubId);
        
        // Return success response with created event
        res.status(201).json({
            success: true,
            message: 'Event created successfully',
            data: event
        });
    } catch (error) {
        console.error('Error in createEventApi:', error);
        
        if (error.message === 'Club not found' || error.message === 'Invalid club UUID format') {
            return res.status(400).json({ success: false, error: error.message });
        }
        
        // Handle validation errors
        if (error.name === 'ZodError') {
            return res.status(400).json({ 
                success: false, 
                error: 'Validation error', 
                details: error.errors 
            });
        }
        
        res.status(500).json({ 
            success: false, 
            error: 'Failed to create event',
            message: error.message
        });
    }
};

module.exports = {
    getAllEvents,
    getEventByUUID,
    getEventById,
    getClubForEventCreation,
    createEvent,
    getEventForEditing,
    updateEvent,
    registerForEvent,
    unregisterFromEvent,
    deleteEvent,
    createEventApi,
};
