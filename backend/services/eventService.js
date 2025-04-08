const { db } = require('../../dist/db');
const {
    event,
    club,
    user,
    userToEventJoined,
    clubMembership,
} = require('../../dist/db/schema');
const { eq, and, sql } = require('drizzle-orm');
const { updateEventStatus } = require('../../utils/eventScheduler');
const {
    insertEventSchema,
    updateEventSchema,
} = require('../../dist/db/schema/event');

// Helper function for UUID validation
const isValidUUID = (uuid) => {
    const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
};

/**
 * Find all events
 * @returns {Promise<Array>} Array of Event objects
 */
const getAllEvents = async () => {
    try {
        return await db.query.event.findMany({
            columns: {
                id: true,
                uuid: true,
                name: true,
                description: true,
                poster: true,
                eventStart: true,
                eventEnd: true,
                location: true,
                status: true,
                seatsAvailable: true,
                seatsRemaining: true,
            },
            with: {
                club: {
                    columns: {
                        name: true,
                        uuid: true,
                        logo: true,
                    },
                },
            },
            orderBy: (events, { asc }) => [asc(events.eventStart)],
        });
    } catch (error) {
        console.error('Error in getAllEvents:', error);
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
        if (!isValidUUID(uuid)) {
            throw new Error('Invalid UUID format');
        }

        const eventData = await db.query.event.findFirst({
            where: eq(event.uuid, uuid),
            columns: {
                id: true,
                uuid: true,
                name: true,
                description: true,
                poster: true,
                registrationStart: true,
                registrationEnd: true,
                eventStart: true,
                eventEnd: true,
                location: true,
                status: true,
                seatsAvailable: true,
                seatsRemaining: true,
                category: true,
            },
            with: {
                club: {
                    columns: {
                        name: true,
                        uuid: true,
                        logo: true,
                    },
                    with: {
                        memberships: {
                            columns: {
                                userId: true,
                                role: true,
                            },
                        },
                    },
                },
                registeredUsers: {
                    columns: {
                        registrationDate: true,
                    },
                    with: {
                        user: {
                            columns: {
                                uuid: true,
                                displayName: true,
                                email: true,
                                profileImage: true,
                            },
                        },
                    },
                },
            },
        });

        if (!eventData) {
            throw new Error('Event not found');
        }

        return eventData;
    } catch (error) {
        console.error('Error in findByUUID:', error);
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
        if (!isValidUUID(clubId)) {
            throw new Error('Invalid club UUID format');
        }

        // First get the club data to get its ID
        const clubData = await db.query.club.findFirst({
            where: eq(club.uuid, clubId),
        });

        if (!clubData) {
            throw new Error('Club not found');
        }

        // Now add the clubId to the event data before validation
        const dataToValidate = {
            ...eventData,
            clubId: clubData.id,
            status: 'upcoming',
            seatsRemaining: eventData.seatsAvailable,
        };

        const validatedData = insertEventSchema.parse(dataToValidate);

        const [newEvent] = await db
            .insert(event)
            .values(validatedData)
            .returning();

        // Set initial status
        await updateEventStatus(newEvent.uuid);

        return newEvent;
    } catch (error) {
        console.error('Error in createEvent:', error);
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
        if (!isValidUUID(eventId)) {
            throw new Error('Invalid UUID format');
        }

        // If seatsRemaining is in the update data, throw error
        if ('seatsRemaining' in updateData) {
            throw new Error('Cannot directly update seatsRemaining');
        }

        const validatedData = updateEventSchema.parse(updateData);
        const existingEvent = await findByUUID(eventId);

        // Only check seats if admin is updating seatsAvailable
        if (validatedData.seatsAvailable !== undefined) {
            const registeredCount = await db
                .select({ count: sql`count(*)` })
                .from(userToEventJoined)
                .where(eq(userToEventJoined.eventId, existingEvent.id));

            if (validatedData.seatsAvailable < registeredCount[0].count) {
                throw new Error(
                    'Cannot reduce seats below number of registered users',
                );
            }

            // Update seatsRemaining based on new seatsAvailable
            validatedData.seatsRemaining =
                validatedData.seatsAvailable - registeredCount[0].count;
        }

        const [updatedEvent] = await db
            .update(event)
            .set(validatedData)
            .where(eq(event.uuid, eventId))
            .returning();

        await updateEventStatus(eventId);

        return updatedEvent;
    } catch (error) {
        console.error('Error in updateEvent:', error);
        throw error;
    }
};

/**
 * Register user for event
 * @param {String} eventId Event UUID
 * @param {number} userId User ID
 * @returns {Promise<Object>} Updated event
 */
const registerUser = async (eventId, userId) => {
    try {
        const eventData = await findByUUID(eventId);

        if (eventData.status !== 'registration_open') {
            throw new Error(
                'Registration is not currently open for this event',
            );
        }

        if (eventData.seatsRemaining <= 0) {
            throw new Error('No seats available');
        }

        // Check if already registered
        const existingRegistration = await db.query.userToEventJoined.findFirst(
            {
                where: and(
                    eq(userToEventJoined.eventId, eventData.id),
                    eq(userToEventJoined.userId, userId),
                ),
            },
        );

        if (existingRegistration) {
            throw new Error('User is already registered for this event');
        }

        // Register user
        await db.insert(userToEventJoined).values({
            eventId: eventData.id,
            userId: userId,
        });

        // Update seats remaining
        const [updatedEvent] = await db
            .update(event)
            .set({
                seatsRemaining: eventData.seatsRemaining - 1,
            })
            .where(eq(event.id, eventData.id))
            .returning();

        return updatedEvent;
    } catch (error) {
        console.error('Error in registerUser:', error);
        throw error;
    }
};

/**
 * Unregister user from event
 * @param {String} eventId Event UUID
 * @param {number} userId User ID
 * @returns {Promise<Object>} Updated event
 */
const unregisterUser = async (eventId, userId) => {
    try {
        const eventData = await findByUUID(eventId);

        if (eventData.status !== 'registration_open') {
            throw new Error('Cannot unregister from this event at this time');
        }

        // Check if registered
        const existingRegistration = await db.query.userToEventJoined.findFirst(
            {
                where: and(
                    eq(userToEventJoined.eventId, eventData.id),
                    eq(userToEventJoined.userId, userId),
                ),
            },
        );

        if (!existingRegistration) {
            throw new Error('User is not registered for this event');
        }

        // Unregister user
        await db
            .delete(userToEventJoined)
            .where(
                and(
                    eq(userToEventJoined.eventId, eventData.id),
                    eq(userToEventJoined.userId, userId),
                ),
            );

        // Update seats remaining
        const [updatedEvent] = await db
            .update(event)
            .set({
                seatsRemaining: eventData.seatsRemaining + 1,
            })
            .where(eq(event.id, eventData.id))
            .returning();

        return updatedEvent;
    } catch (error) {
        console.error('Error in unregisterUser:', error);
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
        const eventData = await findByUUID(eventId);
        // Cascade will handle deleting all registrations automatically
        await db.delete(event).where(eq(event.id, eventData.id));
    } catch (error) {
        console.error('Error in deleteEvent:', error);
        throw error;
    }
};

/**
 * Find club by UUID
 * @param {String} uuid Club UUID
 * @returns {Promise<Object>} Club object
 */
const findClubByUUID = async (uuid) => {
    try {
        return await db.query.club.findFirst({
            where: eq(club.uuid, uuid),
        });
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
    findClubByUUID,
    isValidUUID,
};
