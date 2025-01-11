const Club = require('../models/club');

/**
 * Find club by ID 
 * @param {String} clubId
 * @returns {Promise<Object>} Club object
 */
async function findById(clubId) {
    return await Club.findById(clubId).lean();
}
/**
 * Find club by UUID
 * @param {String} UUID 
 * @returns {Promise<Object>} Club object
 */
async function findByUUID(uuid) {
    return await Club.findOne({ uuid }).lean();
}

/**
 * Find club by name
 * @param {String} name
 * @returns {Promise<Object>} Club object
 */
async function findByName(name) {
    return await Club.findOne({ name }).lean();
}

// Find clubs by their admin
async function findByAdmin(adminId) {
    return await Club.find({ clubAdmin: adminId });
}

// Create new club
async function createClub(clubData) {
    const club = new Club(clubData);
    return await club.save();
}

// Update club details
async function updateClub(clubId, updateData) {
    return await Club.findByIdAndUpdate(
        clubId,
        { $set: updateData },
        { new: true, runValidators: true }
    );
}


// Delete club
async function deleteClub(clubId) {
    return await Club.findByIdAndDelete(clubId);
}

// Add event to club
async function addEvent(clubId, eventId) {
    // since events are not implemented yet, this function will not do anything
    return
}

// Remove event from club
async function removeEvent(clubId, eventId) {
    // since events are not implemented yet, this function will not do anything
    return
}

// Find clubs by event
async function findByEvent(eventId) {
    // since events are not implemented yet, this function will not do anything
    return
}
// Update club admin
async function updateClubAdmin(clubId, newAdminId) {
    return await Club.findByIdAndUpdate(
        clubId,
        { clubAdmin: newAdminId },
        { new: true }
    ).populate('clubAdmin');
}

module.exports = {
    findById,
    findByUUID,
    findByName,
    findByAdmin,
    createClub,
    updateClub,
    deleteClub,
    addEvent,
    removeEvent,
    findByEvent,
    updateClubAdmin
};