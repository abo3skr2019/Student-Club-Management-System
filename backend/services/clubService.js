const Club = require("../models/Club");
const User = require("../models/User");

/**
 * Find club by ID
 * @param {String} clubId
 * @returns {Promise<Object>} Club object
 */
async function findById(clubId) {
  try {
    if (!clubId) {
      throw new Error("clubId is required");
    }
    return await Club.findById(clubId).lean();
  } catch (error) {
    console.error("Error in clubService.findById: ", error);
    throw error;
  }
}
/**
 * Find club by UUID
 * @param {String} UUID
 * @returns {Promise<Object>} Club object
 */
async function findByUUID(uuid) {
  try {
    if (!uuid) {
      throw new Error("UUID is required");
    }
    return await Club.findOne({ uuid }).lean();
  } catch (error) {
    console.error("Error in clubService.findByUUID: ", error);
    throw error;
  }
}

/**
 * Find club by name
 * @param {String} name
 * @returns {Promise<Object>} Club object
 */
async function findByName(name) {
  try {
    if (!name) {
      throw new Error("name is required");
    }
    return await Club.findOne({ name }).lean();
  } catch (error) {
    console.error("Error in clubService.findByName: ", error);
    throw error;
  }
}

/**
 *
 * @param {String} adminId
 * @returns {Promise<Object>} Club object
 */
async function findByAdmin(adminId) {
  try {
    if (!adminId) {
      throw new Error("adminId is required");
    }
    return await Club.find({ clubAdmin: adminId });
  } catch (error) {
    console.error("Error in clubService.findByAdmin: ", error);
    throw error;
  }
}

/**
 * Get all clubs in the database
 * @returns {Promise<Array>} Array of Club objects
 */
async function getAllClubs() {
  try {
    return await Club.find().populate("clubAdmin", "displayName email").lean();
  } catch (error) {
    console.error("Error in clubService.getAllClubs: ", error);
    throw error;
  }
}

/**
 * Create a new club
 * @param {Object} clubData
 * @param {String} clubData.name
 * @param {String} clubData.description
 * @param {String} clubData.logo
 * @param {String} clubData.clubAdmin
 * @returns {Promise<Object>} Club object
 * @throws {Error} If clubData is not provided
 */
async function createClub(clubData) {
  try {
    if (!clubData) {
      throw new Error("clubData is required");
    }
    const requiredFields = ["name", "description", "logo", "clubAdmin"];
    for (const field of requiredFields) {
      if (!clubData[field]) {
        throw new Error(`${field} is required`);
      }
    }
    const club = new Club(clubData);
    return await club.save();
  } catch (error) {
    console.error("Error in clubService.createClub: ", error);
    throw error;
  }
}

/**
 *
 * @param {String} clubId
 * @param {Object} updateData
 * @param {String} updateData.name
 * @param {String} updateData.description
 * @param {String} updateData.logo
 * @returns {Promise<Object>} Club object
 */
async function updateClub(clubId, updateData) {
  try {
    if (!clubId) {
      throw new Error("clubId is required");
    }
    if (!updateData) {
      throw new Error("updateData is required");
    }
    return await Club.findByIdAndUpdate(
      clubId,
      { $set: updateData },
      { new: true, runValidators: true }
    );
  } catch (error) {
    console.error("Error in clubService.updateClub: ", error);
    throw error;
  }
}

/**
 * Delete club by ID
 * @param {String} clubId
 * @returns {Promise<Object>} Club object
 */
async function deleteClub(clubId) {
  try {
    if (!clubId) {
      throw new Error("clubId is required");
    }
    return await Club.findByIdAndDelete(clubId);
  } catch (error) {
    console.error("Error in clubService.deleteClub: ", error);
    throw error;
  }
}

// Add event to club
async function addEvent(clubId, eventId) {
  // since events are not implemented yet, this function will not do anything
  throw new Error("Events are not implemented yet");
  try {
    if (!clubId) {
      throw new Error("clubId and eventId are required");
    }
    if (!eventId) {
      throw new Error("eventId is required");
    }
  } catch (error) {
    console.error("Error in clubService.addEvent: ", error);
    throw error;
  }
}

// Remove event from club
async function removeEvent(clubId, eventId) {
  // since events are not implemented yet, this function will not do anything
  throw new Error("Events are not implemented yet");
  try {
    if (!clubId) {
      throw new Error("clubId and eventId are required");
    }
    if (!eventId) {
      throw new Error("eventId is required");
    }
  } catch (error) {
    console.error("Error in clubService.addEvent: ", error);
    throw error;
  }

  return;
}

// Find clubs by event
async function findByEvent(eventId) {
  // since events are not implemented yet, this function will not do anything
  throw new Error("Events are not implemented yet");
  try {
    if (!eventId) {
      throw new Error("eventId is required");
    }
  } catch (error) {
    console.error("Error in clubService.findByEvent: ", error);
    throw error;
  }
  return;
}
/**
 * Update club admin
 * @param {String} clubId
 * @param {String} newClubAdminId
 * @returns {Promise<Object>} Club object
 * @throws {Error} If clubId or newClubAdminId is not provided
 * @throws {Error} If club not found
 * @throws {Error} If newClubAdmin not found
 * @throws {Error} If user is already this club's admin
 */
async function updateClubAdmin(clubId, newClubAdminId) {
  try {
    const club = await Club.findById(clubId);
    if (!club) {
      throw new Error("Club not found");
    }
    if (club.clubAdmin.toString() === newClubAdminId.toString()) {
      throw new Error("User is already this club's admin");
    }

    const newClubAdmin = await User.findById(newClubAdminId);
    if (!newClubAdmin) {
      throw new Error("New admin not found");
    }

    const oldClubAdmin = await User.findById(club.clubAdmin);
    if (oldClubAdmin) {
      oldClubAdmin.clubsManaged = oldClubAdmin.clubsManaged.filter(
        (id) => id.toString() !== club._id.toString()
      );

      if (
        oldClubAdmin.clubsManaged.length === 0 &&
        oldClubAdmin.role === "ClubAdmin"
      ) {
        oldClubAdmin.role = "Member";
      }
      await oldClubAdmin.save();
    }

    if (!newClubAdmin.clubsManaged.includes(club._id)) {
      newClubAdmin.clubsManaged.push(club._id);
    }
    if (newClubAdmin.role === "Member" || newClubAdmin.role === "Visitor") {
      newClubAdmin.role = "ClubAdmin";
    }
    await newClubAdmin.save();

    club.clubAdmin = newClubAdmin._id;
    return await club.save();
  } catch (error) {
    console.error("Error in clubService.updateClubAdmin: ", error);
    throw error;
  }
}

module.exports = {
  findById,
  findByUUID,
  findByName,
  findByAdmin,
  getAllClubs,
  createClub,
  updateClub,
  deleteClub,
  addEvent,
  removeEvent,
  findByEvent,
  updateClubAdmin,
};
