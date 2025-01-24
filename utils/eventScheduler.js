const schedule = require('node-schedule');
const Event = require('../backend/models/Event');

// Run every minute
const updateEventStatuses = schedule.scheduleJob('* * * * *', async function() {
    try {
        const now = new Date();
        
        // Find events that need status updates
        const events = await Event.find({
            $or: [
                { eventEnd: { $lt: now }, status: { $ne: 'completed' } },
                { 
                    eventStart: { $lte: now }, 
                    eventEnd: { $gte: now }, 
                    status: { $ne: 'ongoing' } 
                },
                { 
                    registrationStart: { $lte: now }, 
                    registrationEnd: { $gte: now }, 
                    status: { $ne: 'registration_open' } 
                },
                { 
                    registrationStart: { $gt: now }, 
                    status: { $ne: 'upcoming' } 
                },
                {
                    registrationEnd: { $lt: now },
                    eventStart: { $gt: now },
                    status: { $nin: ['registration_closed', 'cancelled'] }
                }
            ]
        });

        if (events.length > 0) {
            console.log(`Updating status for ${events.length} events`);
        }

        for (const event of events) {
            // Update status based on current time
            if (event.eventEnd < now) {
                event.status = 'completed';
            } else if (event.eventStart <= now && event.eventEnd >= now) {
                event.status = 'ongoing';
            } else if (now >= event.registrationStart && now <= event.registrationEnd) {
                event.status = 'registration_open';
            } else if (now < event.registrationStart) {
                event.status = 'upcoming';
            } else if (now > event.registrationEnd && now < event.eventStart) {
                event.status = 'registration_closed';
            }

            await event.save({ validateBeforeSave: false }); // Skip validation as we're only updating status
        }
    } catch (error) {
        console.error('Error updating event statuses:', error);
    }
});

// Run on application startup to ensure all statuses are correct
const initializeEventStatuses = async () => {
    try {
        console.log('Starting event status initialization...');

        const now = new Date();

        await Event.updateMany(
            { eventEnd: { $lt: now } },
            { $set: { status: 'completed' } }
        );
        await Event.updateMany(
            { eventStart: { $lte: now }, eventEnd: { $gte: now } },
            { $set: { status: 'ongoing' } }
        );
        await Event.updateMany(
            { registrationStart: { $lte: now }, registrationEnd: { $gte: now } },
            { $set: { status: 'registration_open' } }
        );
        await Event.updateMany(
            { registrationStart: { $gt: now } },
            { $set: { status: 'upcoming' } }
        );
        await Event.updateMany(
            { registrationEnd: { $lt: now }, eventStart: { $gt: now } },
            { $set: { status: 'registration_closed' } }
        );

        console.log('Event status initialization completed');
    } catch (error) {
        console.error('Error initializing event statuses:', error);
    }
};

module.exports = {
    updateEventStatuses,
    initializeEventStatuses
};