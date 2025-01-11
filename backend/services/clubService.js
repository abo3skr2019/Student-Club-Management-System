const Club = require("../models/Club");

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
  return;
}

// Remove event from club
async function removeEvent(clubId, eventId) {
  // since events are not implemented yet, this function will not do anything
  return;
}

// Find clubs by event
async function findByEvent(eventId) {
  // since events are not implemented yet, this function will not do anything
  return;
}
// Update club admin
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
      )
      {
        oldClubAdmin.role = "Visitor";
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
  createClub,
  updateClub,
  deleteClub,
  addEvent,
  removeEvent,
  findByEvent,
  updateClubAdmin,
};
