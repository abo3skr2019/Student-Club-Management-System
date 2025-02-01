const User = require("../models/User");
const Club = require("../models/Club");
const VALID_ROLES = ["Admin", "ClubAdmin", "Member", "Visitor"];
const { getIdType } = require("../utils/IdValidators");

/**
 * Find user by ID and return user object
 * @param {String} userId
 * @returns {Promise<Object>} leaned User object
 */
const findById = async (userId) => {
  try {
    if (!userId) {
      throw new Error("userId is required");
    }
    const idType = getIdType(userId);
    if (!idType) {
      throw new Error("Invalid ID format");
    }

    let user;
    if (idType === "ObjectId") {
      user = await User.findById(userId);
    } else {
      user = await User.findOne({ uuid: userId });
    }

    if (!user) {
      throw new Error("User not found");
    }

    return await user.populate("clubsManaged clubsJoined").lean();
  } catch (error) {
    console.error("Error in userService.findById: ", error);
    throw error;
  }
};
/**
 *
 * @param {String} uuid
 * @returns {Promise<Object>} leaned User object
 */
const findByUUID = async (uuid) => {
  try {
    if (!uuid) {
      throw new Error("UUID is required");
    }
    return await User.findOne({ uuid }).lean();
  } catch (error) {
    console.error("Error in userService.findByUUID: ", error);
    throw error;
  }
};

/**
 *
 * @param {String} email
 * @returns {Promise<Object>} leaned User object
 */
const findByEmail = async (email) => {
  try {
    if (!email) {
      throw new Error("Email is required");
    }
    return await User.findOne({ email }).lean();
  } catch (error) {
    console.error("Error in userService.findByEmail: ", error);
    throw error;
  }
};
/**
 *
 * @param {String} role
 * @returns {Promise<Object>} leaned User object
 */
const findByRole = async (role) => {
  try {
    if (!role) {
      throw new Error("Role is required");
    }
    return await User.find({ role }).lean();
  } catch (error) {
    console.error("Error in userService.findByRole: ", error);
    throw error;
  }
};

/**
 * Find all users who have joined a specific club
 * @param {String} clubId
 * @returns {Promise<Array<User>>} Array of User objects
 */
const findByClubsJoined = async (clubId) => {
  try {
    if (!clubId) {
      throw new Error("clubId is required");
    }
    return await User.find({
      clubsJoined: clubId,
    }).populate("clubsJoined");
  } catch (error) {
    console.error("Error in userService.findByClubsJoined: ", error);
    throw error;
  }
};

/**
 * TODO: Implement Multiple ClubAdmins
 * Find all users who manage a specific club
 * @param {String} clubId
 * @returns {Promise<Array<User>>} Array of User objects
 */
const findByClubsManaged = async (clubId) => {
  try {
    if (!clubId) {
      throw new Error("clubId is required");
    }
    return await User.find({ clubsManaged: clubId }).populate("clubsManaged");
  } catch (error) {
    console.error("Error in userService.findByClubsManaged: ", error);
    throw error;
  }
};
// Find All Users who have joined a specific event
const findByEventsJoined = async (eventId) => {
  // since events are not implemented yet, this function will not do anything
  try {
    throw new Error("Events are not implemented yet");
    if (!eventId) {
      throw new Error("eventId is required");
    }
  } catch (error) {
    console.error("Error in userService.findByEventsJoined: ", error);
    throw error;
  }
};

async function findUserEvents(userId) {
  try {
    throw new Error("Events are not implemented yet");
    if (!userId) {
      throw new Error("userId is required");
    }
    const user = await User.findById(userId).populate("eventsJoined");
    if (!user) {
      throw new Error("User not Found");
    }
    return user.eventsJoined;
  } catch (error) {
    console.error("Error in userService.findUserEvents: ", error);
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
 * @returns {Promise<Object>} leaned User object
 */
const updateProfile = async (userId, updateData) => {
  try {
    if (!userId) {
      throw new Error("userId is required");
    }
    const idType = getIdType(userId);
    if (!idType) {
      throw new Error("Invalid ID format");
    }

    if (!updateData) {
      throw new Error("updateData is required");
    }

    // Validate updateData fields
    const allowedFields = ["firstName", "lastName", "email", "profilePicture"];
    const invalidFields = Object.keys(updateData).filter(
      (field) => !allowedFields.includes(field)
    );

    if (invalidFields.length > 0) {
      throw new Error(`Invalid fields: ${invalidFields.join(", ")}`);
    }

    // Only set displayName if both firstName and lastName are provided and not empty
    if (
      updateData.firstName &&
      updateData.lastName &&
      updateData.firstName.trim() &&
      updateData.lastName.trim()
    ) {
      updateData.displayName = `${updateData.firstName} ${updateData.lastName}`;
    }

    let updatedUser;
    if (idType === "ObjectId") {
      updatedUser = await User.findByIdAndUpdate(
        userId,
        { $set: updateData },
        { new: true, runValidators: true }
      );
    } else {
      updatedUser = await User.findOneAndUpdate(
        { uuid: userId },
        { $set: updateData },
        { new: true, runValidators: true }
      );
    }

    if (!updatedUser) {
      throw new Error("User not found");
    }
    return updatedUser.lean();
  } catch (error) {
    console.error("Error in userService.updateProfile: ", error);
    throw error;
  }
};

/**
 * Change user role
 * @param {String} userId
 * @param {String} role
 * @throws {Error} If userId or role is not provided
 * @throws {Error} If role is not valid
 * @returns {Promise<User>} User object
 */
const changeRole = async (userId, role) => {
  try {
    if (!userId) {
      throw new Error("userId is required");
    }
    if (!role) {
      throw new Error("role is required");
    }
    if (!VALID_ROLES.includes(role)) {
      throw new Error(`Invalid role: ${role} `);
    }
    const user = await User.findById(userId);
    if (!user) {
      throw new Error("User not Found");
    }
    user.role = role;

    return await user.save();
  } catch (error) {
    console.error("Error in userService.changeRole: ", error);
    throw error;
  }
};

/**
 * Add user to club
 * @param {String} userId
 * @param {String} clubId
 * @returns {Promise<User>} User object
 */
const joinClub = async (userId, clubId) => {
  try {
    if (!userId || !clubId) {
      throw new Error("userId and clubId are required");
    }
    
    const userIdType = getIdType(userId);
    const clubIdType = getIdType(clubId);
    if (!userIdType || !clubIdType) {
      throw new Error("Invalid ID format");
    }

    let user = userIdType === "ObjectId" ? 
      await User.findById(userId) : 
      await User.findOne({ uuid: userId });

    let club = clubIdType === "ObjectId" ? 
      await Club.findById(clubId) : 
      await Club.findOne({ uuid: clubId });

    if (!user) {
      throw new Error("User not Found");
    }
    if (!club) {
      throw new Error("Club not Found");
    }
    if (user.clubsJoined.includes(clubId)) {
      throw new Error("User is already a Member of this Club");
    } 
    user.clubsJoined.push(clubId);
    club.clubMembers.push(userId);
    await Promise.all([
      user.save(),
      club.save()  // Make sure to save club changes
    ]);
    return user;
  } catch (error) {
    console.error("Error in userService.joinClub: ", error);
    throw error;
  }
};

/**
 * Remove user from club
 * @param {String} userId
 * @param {String} clubId
 * @returns {Promise<Object>} leaned User object
 * @throws {Error} If userId or clubId is not provided
 */
const leaveClub = async (userId, clubId) => {
  try {
    if (!userId) {
      throw new Error("userId is required");
    }
    if (!clubId) {
      throw new Error("clubId is required");
    }
    const leavingUser = await User.findById(userId);

    const club = await Club.findById(clubId);

    if (!club) {
      throw new Error("Club not Found");
    }
    if (!leavingUser) {
      throw new Error("User not Found");
    }
    if (!leavingUser.clubsJoined) {
      throw new Error("User is not a Member of Any Club");
    }
    if (!leavingUser.clubsJoined.includes(clubId)) {
      throw new Error("User is not a Member of this Club");
    }


    // Remove user from club's members
    club.clubMembers = club.clubMembers.filter(
      (id) => id.toString() !== userId.toString()
    );

    leavingUser.clubsJoined = leavingUser.clubsJoined.filter(
      (id) => id.toString() !== clubId
    );

    await Promise.all([
      leavingUser.save(),
      club.save()
    ]);    
    return (await leavingUser.populate("clubsJoined")).lean();
  } catch (error) {
    console.error("Error in userService.leaveClub: ", error);
    throw error;
  }
};

module.exports = {
  findById,
  findByUUID,
  findByEmail,
  findByClubsJoined,
  findByClubsManaged,
  findByEventsJoined,
  findUserEvents,
  findByRole,
  updateProfile,
  changeRole,
  joinClub,
  leaveClub,
};
