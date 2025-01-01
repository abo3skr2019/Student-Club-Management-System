const mongoose = require('mongoose');

const clubSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    description: {
        type: String,
        required: true,
    },
    logo: {
        type: String,
        required: true,
    },
    admin: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
        // Will be required once auth is implemented
    },
    createdEvents: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Event',
        index: true
    }]
}, {
    timestamps: true
});

module.exports = mongoose.model('Club', clubSchema);