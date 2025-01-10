const User = require('../models/User');

// Find user by UUID
async function findByUUID(uuid) {
    return await User.findOne({ uuid });
}

// Find user by email
async function findByEmail(email) {
    return await User.findOne({ email });
}

// Find all users who have joined a specific club
async function findByClubsJoined(clubId) {
    return await User.find({ 
        clubsJoined: clubId 
    })
}

// Find all users who manage a specific club
async function findByClubsManaged(clubId) {
    return await User.find({ 
        clubsManaged: clubId 
    }).populate('clubsManaged');
}

// Find All Users who have joined a specific event
async function findByEventsJoined(eventId) {
    // since events are not implemented yet, this function will not do anything
    return
}
// Find users by role
async function findByRole(role) {
    return await User.find({ role });
}

// Update user profile
async function updateProfile(userId, updateData) {
    return await User.findByIdAndUpdate(
        userId,
        { $set: updateData },
        { new: true, runValidators: true }
    );
}

// Add user to club
async function joinClub(userId, clubId) {
    return await User.findByIdAndUpdate(
        userId,
        { $addToSet: { clubsJoined: clubId } },
        { new: true }
    );
}

// Remove user from club
async function leaveClub(userId, clubId) {
    return await User.findByIdAndUpdate(
        userId,
        { $pull: { clubsJoined: clubId } },
        { new: true }
    );
}

module.exports = {
    findByUUID,
    findByEmail,
    findByClubsJoined,
    findByClubsManaged,
    findByEventsJoined,
    findByRole,
    updateProfile,
    joinClub,
    leaveClub
};