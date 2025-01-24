const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const EventSchema = new mongoose.Schema({
    uuid: {
        type: String,
        unique: true,
        sparse: true,
        index: true
    },
    name: {
        type: String,
        required: true,
        index: true
    },
    description: {
        type: String,
        required: true,
    },
    poster: {
        type: String,
        required: true,
    },
    location: {
        type: String,
        required: true,
    },
    registrationStart: {
        type: Date,
        required: true,
    },
    registrationEnd: {
        type: Date,
        required: true,
    },
    eventStart: {
        type: Date,
        required: true,
    },
    eventEnd: {
        type: Date,
        required: true,
    },
    seatsAvailable: {
        type: Number,
        required: true,
        min: 0
    },
    seatsRemaining: {
        type: Number,
        min: 0
    },
    category: {
        type: String,
        required: true,
        enum: ['bootcamp', 'workshop', 'meeting', 'hackathon', 'seminar', 'conference', 'networking']
    },
    club: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Club',
        required: true,
        index: true
    },
    registeredUsers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    status: {
        type: String,
        enum: ['upcoming', 'registration_open', 'registration_closed', 'ongoing', 'completed', 'cancelled'],
        default: 'upcoming'
    }
}, {
    timestamps: true
});

// Generate UUID and set initial seatsRemaining
EventSchema.pre('save', function(next) {
    if (this.isNew) {
        if (!this.uuid) {
            this.uuid = uuidv4();
        }
        this.seatsRemaining = this.seatsAvailable;
    }
    next();
});

EventSchema.index({ eventStart: 1, status: 1 });
EventSchema.index({ club: 1, status: 1 });
EventSchema.index({ registeredUsers: 1, status: 1 });
EventSchema.index({ status: 1, seatsRemaining: 1 });a

module.exports = mongoose.model('Event', EventSchema);