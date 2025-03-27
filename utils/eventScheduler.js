const schedule = require('node-schedule');
const { db } = require('../dist/db');
const { event } = require('../dist/db/schema');
const { eq, ne } = require('drizzle-orm');

/**
 * Update status for a single event
 * @param {String} eventId Event UUID
 * @returns {Promise<Object>} Updated event
 */
const updateEventStatus = async (eventId) => {
    try {
        const eventData = await db.query.event.findFirst({
            where: eq(event.uuid, eventId),
            columns: {
                id: true,
                uuid: true,
                registrationStart: true,
                registrationEnd: true,
                eventStart: true,
                eventEnd: true,
                status: true,
            },
        });

        if (!eventData) {
            throw new Error('Event not found');
        }

        const now = new Date();
        let newStatus;

        // Determine new status
        if (eventData.eventEnd < now) {
            newStatus = 'completed';
        } else if (eventData.eventStart <= now && eventData.eventEnd >= now) {
            newStatus = 'ongoing';
        } else if (
            now >= eventData.registrationStart &&
            now <= eventData.registrationEnd
        ) {
            newStatus = 'registration_open';
        } else if (now < eventData.registrationStart) {
            newStatus = 'upcoming';
        } else if (
            now > eventData.registrationEnd &&
            now < eventData.eventStart
        ) {
            newStatus = 'registration_closed';
        }

        // Only update if status has changed
        if (newStatus && newStatus !== eventData.status) {
            await db
                .update(event)
                .set({ status: newStatus })
                .where(eq(event.id, eventData.id));
            console.log(
                `Updated event ${eventData.uuid} status to ${newStatus}`,
            );
        }

        return eventData;
    } catch (error) {
        console.error(`Error updating event ${eventId} status:`, error);
        throw error;
    }
};

// Run daily at midnight
const updateEventStatuses = schedule.scheduleJob(
    '0 0 * * *',
    async function () {
        try {
            console.log('Starting daily event status update...');
            const now = new Date();

            const events = await db.query.event.findMany({
                where: ne(event.status, 'cancelled'),
                columns: {
                    id: true,
                    uuid: true,
                },
            });

            if (events.length > 0) {
                console.log(
                    `Checking ${events.length} events for status updates`,
                );

                for (const event of events) {
                    await updateEventStatus(event.uuid);
                }
            }

            console.log('Daily event status update completed');
        } catch (error) {
            console.error('Error in daily event status update:', error);
        }
    },
);

// Run on application startup to ensure all statuses are correct
const initializeEventStatuses = async () => {
    try {
        console.log('Starting event status initialization...');

        const events = await db.query.event.findMany({
            where: ne(event.status, 'cancelled'),
            columns: {
                id: true,
                uuid: true,
                status: true,
            },
        });

        let updateCount = 0;

        for (const eventData of events) {
            const previousStatus = eventData.status;
            await updateEventStatus(eventData.uuid);
            if (eventData.status !== previousStatus) {
                updateCount++;
            }
        }

        console.log(
            `Event status initialization completed. Updated ${updateCount} events`,
        );
    } catch (error) {
        console.error('Error initializing event statuses:', error);
        throw error;
    }
};

module.exports = {
    updateEventStatus,
    updateEventStatuses,
    initializeEventStatuses,
};
