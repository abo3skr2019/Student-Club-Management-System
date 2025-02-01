const schedule = require('node-schedule');
const Event = require('../backend/models/Event');

/**
 * Update status for a single event
 * @param {String} eventId Event UUID
 * @returns {Promise<Object>} Updated event
 */
const updateEventStatus = async (eventId) => {
    try {
        const event = await Event.findOne({ uuid: eventId });
        if (!event) {
            throw new Error('Event not found');
        }

        const now = new Date();
        let newStatus;

        // Determine new status
        if (event.eventEnd < now) {
            newStatus = 'completed';
        } else if (event.eventStart <= now && event.eventEnd >= now) {
            newStatus = 'ongoing';
        } else if (now >= event.registrationStart && now <= event.registrationEnd) {
            newStatus = 'registration_open';
        } else if (now < event.registrationStart) {
            newStatus = 'upcoming';
        } else if (now > event.registrationEnd && now < event.eventStart) {
            newStatus = 'registration_closed';
        }

        // Only update if status has changed
        if (newStatus && newStatus !== event.status) {
            event.status = newStatus;
            await event.save({ validateBeforeSave: false });
            console.log(`Updated event ${event.uuid} status to ${newStatus}`);
        }

        return event;
    } catch (error) {
        console.error(`Error updating event ${eventId} status:`, error);
        throw error;
    }
};

// Run daily at midnight
const updateEventStatuses = schedule.scheduleJob('0 0 * * *', async function() {
    try {
        console.log('Starting daily event status update...');
        const now = new Date();
        
        const events = await Event.find({ status: { $ne: 'cancelled' } });

        if (events.length > 0) {
            console.log(`Checking ${events.length} events for status updates`);
            
            for (const event of events) {
                await updateEventStatus(event.uuid);
            }
        }

        console.log('Daily event status update completed');
    } catch (error) {
        console.error('Error in daily event status update:', error);
    }
});

// Run on application startup to ensure all statuses are correct
const initializeEventStatuses = async () => {
    try {
        console.log('Starting event status initialization...');
        
        const events = await Event.find({ status: { $ne: 'cancelled' } });
        let updateCount = 0;

        for (const event of events) {
            const previousStatus = event.status;
            await updateEventStatus(event.uuid);
            if (event.status !== previousStatus) {
                updateCount++;
            }
        }

        console.log(`Event status initialization completed. Updated ${updateCount} events`);
    } catch (error) {
        console.error('Error initializing event statuses:', error);
        throw error;
    }
};

module.exports = {
    updateEventStatus,
    updateEventStatuses,
    initializeEventStatuses
};