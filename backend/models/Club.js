const mongoose = require('mongoose');

const clubSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
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
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

clubSchema.virtual('events', {
    ref: 'Event',
    localField: '_id',
    foreignField: 'club_id'
});

module.exports = mongoose.model('Club', clubSchema);