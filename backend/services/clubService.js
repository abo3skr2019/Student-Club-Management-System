const Club = require("../models/Club");
const User = require("../models/User");
const { getIdType } = require("../utils/IdValidators");
/**
 * Find club by ID
 * @param {String} club Object ID
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
 * @param {String} Club UUID
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
    const idType = getIdType(adminId);
    if (!idType) {
      throw new Error("Invalid ID format");
    }

    const query = idType === "ObjectId" ? 
      { clubAdmin: adminId } : 
      { "clubAdmin.uuid": adminId };
    
    return await Club.find(query);
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
 * @param {String} clubId Object ID or UUID
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
    const clubIdType = getIdType(clubId);
    if (!clubIdType) {
      throw new Error("clubId must be a valid ObjectId or UUID");
    }
    if (clubIdType === "ObjectId") {
    return await Club.findByIdAndUpdate(
      clubId,
      { $set: updateData },
      { new: true, runValidators: true }
    );
  }
  if (clubIdType === "UUID") {
    return await Club.findOneAndUpdate(
      { uuid: clubId },
      { $set: updateData },
      { new: true, runValidators: true }
    );
  }
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
    const idType = getIdType(clubId);
    if (!idType) {
      throw new Error("Invalid ID format");
    }

    let club;
    if (idType === "ObjectId") {
      club = await Club.findByIdAndDelete(clubId);
    } else {
      club = await Club.findOneAndDelete({ uuid: clubId });
    }

    if (!club) {
      throw new Error("Club not found");
    }
    return club;
  } catch (error) {
    console.error("Error in clubService.deleteClub: ", error);
    throw error;
  }
}





/**
 * Find club by event
 * @param {String} eventId
 * @returns {Promise<Object>} Club object
 */
async function findByEvent(eventId) {
  // since events are not implemented yet, this function will not do anything
  try {
    if (!eventId) {
      throw new Error("eventId is required");
    }
    const club = await Club.find({ events: eventId });
  } catch (error) {
    console.error("Error in clubService.findByEvent: ", error);
    throw error;
  }
  return club.lean();
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
    const clubIdType = getIdType(clubId);
    const adminIdType = getIdType(newClubAdminId);
    if (!clubIdType || !adminIdType) {
      throw new Error("Invalid ID format");
    }

    let club = clubIdType === "ObjectId" ? 
      await Club.findById(clubId) : 
      await Club.findOne({ uuid: clubId });

    let newClubAdmin = adminIdType === "ObjectId" ? 
      await User.findById(newClubAdminId) : 
      await User.findOne({ uuid: newClubAdminId });

    if (!club) {
      throw new Error("Club not found");
    }
    if (club.clubAdmin.toString() === newClubAdminId.toString()) {
      throw new Error("User is already this club's admin");
    }

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
  findByEvent,
  updateClubAdmin,
};
