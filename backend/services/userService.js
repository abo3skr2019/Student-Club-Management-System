const User = require('../models/User');

/**
 * Find user by ID and return user object
 * @param {String} userId
 * @returns {Promise<Object>} User object
 */
async function findById(userId)
{
    try
    {
        if(!userId)
        {
            throw new Error("userId is required");
        }
        return await User.findById(userId).lean();
    }
    catch(error)
    {
        console.error("Error in userService.FindById: ", error);
        throw error;
    }
    
}
/**
 * 
 * @param {String} uuid
 * @returns {Promise<Object>} User object
 */
async function findByUUID(uuid) {
    try {
        if (!uuid) {
            throw new Error("UUID is required");
        }
        return await User.findOne({ uuid }).lean();
    } catch (error) {
        console.error("Error in userService.findByUUID: ", error);
        throw error;
        
    }
}

/**
 * 
 * @param {String} email
 * @returns {Promise<Object>} User object
 */
async function findByEmail(email) {
    try {
        if (!email) {
            throw new Error("Email is required");
        }
        return await User.findOne({ email }).lean();
    } catch (error) {
        console.error("Error in userService.findByEmail: ", error);
        throw error
    }
}
/**
 * 
 * @param {String} role
 * @returns {Promise<Object>} User object
 */
async function findByRole(role) {
    try {
        if (!role) {
            throw new Error("Role is required");
        }
        return await User.find({ role }).lean();
    } catch (error) {
        console.error("Error in userService.findByRole: ", error);
        throw error;
    }
}

/**
 * Find all users who have joined a specific club
 * @param {String} clubId
 * @returns {Promise<Array>} Array of User objects
 */
async function findByClubsJoined(clubId) {
    try{
        if(!clubId){
            throw new Error("clubId is required");
        }
        return await User.find({ 
            clubsJoined: clubId 
        }).populate('clubsJoined');    
    }catch(error){
        console.error("Error in userService.findByClubsJoined: ", error);
        throw error;
    }
}

/**
 * TODO: Implement Multiple ClubAdmins
 * Find all users who manage a specific club 
 * @param {String} clubId
 * @returns {Promise<Array>} Array of User objects
 */
async function findByClubsManaged(clubId) {
    try
    {
        if(!clubId)
        {
            throw new Error("clubId is required");
        }
        return await User.find({clubsManaged: clubId }).populate('clubsManaged');
    }
    catch(error)
    {
    console.error("Error in userService.findByClubsManaged: ", error);
    throw error;
    }
}
// Find All Users who have joined a specific event
async function findByEventsJoined(eventId) {
    // since events are not implemented yet, this function will not do anything
    try
    {
        throw new Error("Events are not implemented yet");
        if(!eventId)
        {
            throw new Error("eventId is required");
        }
    }
    catch(error)
    {
        console.error("Error in userService.findByEventsJoined: ", error);
        throw error;
    }
    
}


/**
 * Update user profile
 * @param {String} userId
 * @param {Object} updateData
 * @param {String} updateData.firstName
 * @param {String} updateData.lastName
 * @param {String} updateData.email
 * @param {String} updateData.profilePicture
 * @returns {Promise<Object>} User object
 */
async function updateProfile(userId, updateData) {
    try
    {
        if (!userId) {
            throw new Error("userId is required");
        }
        if (!updateData) {
            throw new Error("updateData is required");
        }   
        return await User.findByIdAndUpdate(
            userId,
            { $set: updateData },
            { new: true, runValidators: true }
        );
    }
    catch(error)
    {
        console.error("Error in userService.updateProfile: ", error);
        throw error;
    }
}

const VALID_ROLES = ['Admin', 'ClubAdmin', 'Member', 'Visitor'];

/**
 * Change user role
 * @param {String} userId
 * @param {String} role
 * @throws {Error} If userId or role is not provided
 * @throws {Error} If role is not valid
 * @returns {Promise<Object>} User object
 */
async function ChangeRole(userId, role) {
    try
    {
        if (!userId) {
            throw new Error("userId is required");
        }
        if (!role) {
            throw new Error("role is required");
        }
        if (!VALID_ROLES.includes(role)) 
        {
            throw new Error("Invalid role ", role);
        }
        return await User.findByIdAndUpdate(
            userId,
            { $set: { role: role } },
            { new: true }
        );
    }
    catch(error)
    {
        console.error("Error in userService.ChangeRole: ", error);
        throw error;
    }
}

/**
 * Add user to club
 * @param {String} userId
 * @param {String} clubId
 * @returns {Promise<Object>} User object
 */
async function joinClub(userId, clubId) {
    try
    {
        if (!userId) {
            throw new Error("userId is required");
        }
        if (!clubId) {
            throw new Error("clubId is required");
        }
        return await User.findByIdAndUpdate(
            userId,
            { $addToSet: { clubsJoined: clubId } },
            { new: true }
        ).populate('clubsJoined');
    }
    catch(error)
    {
        console.error("Error in userService.joinClub: ", error);
        throw error;
    }
}

/**
 * Remove user from club
 * @param {String} userId
 * @param {String} clubId
 * @returns {Promise<Object>} User object
 * @throws {Error} If userId or clubId is not provided
 */
async function leaveClub(userId, clubId) {
    try
    {
        if (!userId) {
            throw new Error("userId is required");
        }
        if (!clubId) {
            throw new Error("clubId is required");
        }
        return await User.findByIdAndUpdate(
            userId,
            { $pull: { clubsJoined: clubId } },
            { new: true }
        ).populate('clubsJoined');
    }
    catch(error){
        console.error("Error in userService.leaveClub: ", error);
        throw error;
    }   
}

module.exports = {
    findById,
    findByUUID,
    findByEmail,
    findByClubsJoined,
    findByClubsManaged,
    findByEventsJoined,
    findByRole,
    updateProfile,
    ChangeRole,
    joinClub,
    leaveClub
};