const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const ClubSchema = new mongoose.Schema({
    uuid: {
        type: String,
        unique: true,
        sparse: true,
        index: true
    },
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
    clubAdmin: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    createdEvents: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Event',
        index: true
    }]
}, {
    timestamps: true
});

ClubSchema.pre('save', function(next) {
    if (this.isNew && !this.uuid) {
        this.uuid = uuidv4();
    }
    next();
});

module.exports = mongoose.model('Club', ClubSchema);