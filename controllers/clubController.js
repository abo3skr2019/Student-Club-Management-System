const clubService = require('../services/clubService');

/**
 * Get all clubs
 * @param {Object} req Express request object
 * @param {Object} res Express response object
 */
const getAllClubs = async (req, res) => {
    // Pass the entire parsedQuery object to the service
    const { items, pagination } = await clubService.getAllClubs(
        req.parsedQuery,
    );
    return res.status(200).json({
        data: items,
        pagination,
    });
};

/**
 * Get club by UUID
 * @param {Object} req Express request object
 * @param {Object} res Express response object
 */
const getClubByUuid = async (req, res) => {
    const clubData = await clubService.findByUUID(
        req.params.clubUuid,
        req.parsedQuery,
    );
    return res.status(200).json({
        data: clubData,
    });
};

/**
 * Create new club
 * @param {Object} req Express request object
 * @param {Object} res Express response object
 */
const createClub = async (req, res) => {
    const clubData = await clubService.createClub(req.body, req.user.id);
    res.status(201).json({
        data: clubData,
    });
};

/**
 * Update club
 * @param {Object} req Express request object
 * @param {Object} res Express response object
 */
const updateClub = async (req, res) => {
    const clubData = await clubService.updateClub(
        req.params.clubUuid,
        req.body,
        req.user.id,
    );
    res.status(200).json({
        data: clubData,
    });
};

/**
 * Delete club
 * @param {Object} req Express request object
 * @param {Object} res Express response object
 */
const deleteClub = async (req, res) => {
    await clubService.deleteClub(req.params.clubUuid, req.user.id);
    res.status(204).end();
};

/**
 * Get all memberships for a club
 * @param {Object} req Express request object
 * @param {Object} res Express response object
 */
const getAllMemberships = async (req, res) => {
    // Pass the entire parsedQuery object to the service
    const { items, pagination } = await clubService.getAllClubMemberships(
        req.params.clubUuid,
        req.parsedQuery,
    );

    return res.status(200).json({
        data: items,
        pagination,
    });
};

/**
 * Get specific membership
 * @param {Object} req Express request object
 * @param {Object} res Express response object
 */
const getMembershipByUuid = async (req, res) => {
    const membership = await clubService.getMembershipByUUID(
        req.params.membershipUuid,
        req.parsedQuery,
    );
    res.status(200).json({
        data: membership,
    });
};

/**
 * Create membership
 * @param {Object} req Express request object
 * @param {Object} res Express response object
 */
const createMembership = async (req, res) => {
    const membership = await clubService.createMembership(
        req.params.clubUuid,
        {
            email: req.body.email,
            role: req.body.role, // Optional
            tag: req.body.tag, // Optional
        },
        req.user.id,
    );

    res.status(201).json({
        data: membership,
    });
};

/**
 * Update membership
 * @param {Object} req Express request object
 * @param {Object} res Express response object
 */
const updateMembership = async (req, res) => {
    const membership = await clubService.updateMembership(
        req.params.membershipUuid,
        req.body,
        req.user.id,
    );
    res.status(200).json({
        data: membership,
    });
};

/**
 * Join club
 * @param {Object} req Express request object
 * @param {Object} res Express response object
 */
const joinClub = async (req, res) => {
    const membership = await clubService.joinClub(
        req.params.clubUuid,
        req.user.id,
    );
    res.status(201).json({
        data: membership,
    });
};

/**
 * Leave club
 * @param {Object} req Express request object
 * @param {Object} res Express response object
 */
const leaveClub = async (req, res) => {
    const updatedMembership = await clubService.leaveClub(
        req.params.clubUuid,
        req.user.id,
    );
    res.status(200).json({
        data: updatedMembership,
    });
};

/**
 * Delete membership
 * @param {Object} req Express request object
 * @param {Object} res Express response object
 */
const deleteMembership = async (req, res) => {
    await clubService.deleteMembership(req.params.membershipUuid, req.user.id);
    res.status(204).end();
};

/**
 * Reset club term - archives inactive/denied memberships and ALL tasks
 * @param {Object} req Express request object
 * @param {Object} res Express response object
 */
const resetClubTerm = async (req, res) => {
    const result = await clubService.resetClubTerm(
        req.params.clubUuid,
        req.user.id,
    );
    res.status(200).json({
        data: result,
    });
};

module.exports = {
    getAllClubs,
    getClubByUuid,
    createClub,
    updateClub,
    deleteClub,
    getAllMemberships,
    getMembershipByUuid,
    createMembership,
    updateMembership,
    joinClub,
    leaveClub,
    deleteMembership,
    resetClubTerm,
};
