const mongoose = require('mongoose');
const { initializeEventStatuses } = require('../../utils/eventScheduler');

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI);
        console.log(`MongoDB Connected: ${conn.connection.host}`);

        // Initialize event statuses after successful connection
        await initializeEventStatuses();
        console.log('Event statuses initialized');
    } catch (err) {
        console.log(err);
    }
    }

    module.exports = connectDB;