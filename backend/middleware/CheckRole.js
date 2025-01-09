const Club = require('../models/Club');
/**
 * Check if user is an admin
 * @param {Request} req - The request object
 * @param {Response} res - The response object
 * @param {Function} next - The next middleware function
 * @returns {void}
 */
const isAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'Admin') {
        return next();
    }
    res.status(403).render('error', { 
        message: 'Admin access required',
        user: req.user 
    });
};
/**
 * Check if user is an admin of the club
 * @param {Request} req - The request object
 * @param {Response} res - The response object
 * @param {Function} next - The next middleware function
 * @returns {void}
 */
const isClubAdmin = async (req, res, next) => {
    try {
        // Check if user is authenticated
        if (!req.user) {
            return res.status(401).render('error', { 
                message: 'Authentication required',
                user: req.user 
            });
        }
        
        // Site admins can manage all clubs
        if (req.user.role === 'Admin') {
            return next();
        }

        // check if user is admin of the club
        /**
         * Find the club
         * @type {string}
         */
        const club = await Club.findOne({
            uuid: req.params.clubId,
            _id: { $in: req.user.clubsManaged }
        })
        .select('_id')
        .lean();

        if (!club) {
            return res.status(403).render('error', { 
                message: 'Club admin access required',
                user: req.user 
            });
        }

        return next();

    } catch(err) {
        console.error('Error in isClubAdmin middleware:', err);
        res.status(500).render('error', {
            message: 'Internal server error',
            user: req.user
        });
    }
};

module.exports = { isAdmin, isClubAdmin };