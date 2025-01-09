const Club = require('../models/Club');

const isAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'Admin') {
        return next();
    }
    res.status(403).render('error', { 
        message: 'Admin access required',
        user: req.user 
    });
};

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

        // Find the club using UUID from params
        const club = await Club.findOne({ uuid: req.params.clubId });

        // Check if club exists
        if (!club) {
            return res.status(404).render('error', { 
                message: 'Club not found',
                user: req.user 
            });
        }

        // Check if user manages this club by comparing ObjectIds
        if (req.user.clubsManaged.includes(club._id)) {
            return next();
        }

        // If none of the above conditions are met, deny access
        res.status(403).render('error', { 
            message: 'Club admin access required',
            user: req.user 
        });
    } catch(err) {
        console.error('Error in isClubAdmin middleware:', err);
        res.status(500).render('error', {
            message: 'Internal server error',
            user: req.user
        });
    }
};

module.exports = { isAdmin, isClubAdmin };