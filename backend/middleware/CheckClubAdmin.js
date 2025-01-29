const Club = require("../models/Club");

/**
 * Middleware to check if the user is a Club Admin and attach club UUID to req.user
 * @param {Request} req - The request object
 * @param {Response} res - The response object
 * @param {Function} next - The next middleware function
 * @returns {void}
 */
const checkClubAdmin = async (req, res, next) => {
    if (req.user) {
        try {
            if (req.user.role === 'ClubAdmin') {
                const club = await Club.findOne({ clubAdmin: req.user._id });
                if (club) {
                    req.user.clubUUID = club.uuid;
                }
            }
        } catch (err) {
            console.error('Error fetching club UUID:', err);
        }
    }
    res.locals.user = req.user || null;
    next();
};

module.exports = {checkClubAdmin};