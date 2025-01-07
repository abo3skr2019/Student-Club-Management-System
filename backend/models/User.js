const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const ProviderSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    providerId: {
        type: String,
        required: true,
        index: true
    },
});
ProviderSchema.index({ name: 1, providerId: 1 }, { unique: true });

const UserSchema = new Schema({
    id: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    displayName: {
        type: String,
        required: true
    },
    firstName: {
        type: String,
        required: true
    },
    lastName: {
        type: String,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        match: [/.+\@.+\..+/, 'Please fill a valid email address'],
        index: true
    },
    profileImage: {
        type: String,
        required: true
    },
    clubsJoined: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Club'
    }],
    clubsManaged: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Club'
    }],
    eventsJoined: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Event',
        index: true
    }],
    /*
    Possible TODO: Add the following fields:
    - eventsManaged: Array of Event references    
    */

    providers: [ProviderSchema],
    role: {
        type: String,
        enum: ['Admin', 'ClubAdmin', 'Member', 'Visitor'],
        default: 'Visitor',
        index: true
    }

}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);