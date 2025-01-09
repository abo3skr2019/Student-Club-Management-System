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

        // check if user is admin of the club
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