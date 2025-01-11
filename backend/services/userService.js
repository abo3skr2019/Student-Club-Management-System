const User = require('../models/User');

/**
 * Find user by ID and return user object
 * @param {String} userId
 * @returns {Promise<Object>} User object
 */
async function FindById(userId)
{
    return await User.findById(userId).lean();
}
/**
 * 
 * @param {String} uuid
 * @returns {Promise<Object>} User object
 */
async function findByUUID(uuid) {
    return await User.findOne({ uuid }).lean();
}

/**
 * 
 * @param {String} email
 * @returns {Promise<Object>} User object
 */
async function findByEmail(email) {
    return await User.findOne({ email }).lean();
}
/**
 * 
 * @param {String} role
 * @returns {Promise<Object>} User object
 */
async function findByRole(role) {
    return await User.find({ role }).lean();
}

// Find all users who have joined a specific club
async function findByClubsJoined(clubId) {
    return await User.find({ 
        clubsJoined: clubId 
    }).populate('clubsJoined');
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
    ).populate('clubsJoined');
}

// Remove user from club
async function leaveClub(userId, clubId) {
    return await User.findByIdAndUpdate(
        userId,
        { $pull: { clubsJoined: clubId } },
        { new: true }
    ).populate('clubsJoined');
}

module.exports = {
    FindById,
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