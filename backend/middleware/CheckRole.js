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
    if (!req.user) {
        return res.status(401).render('error', { 
            message: 'Authentication required',
            user: req.user 
        });
    }
    
    if (req.user.role === 'Admin') {
        return next(); // Site admins can manage all clubs
    }

    // Check if user is admin of this specific club
    const clubId = req.params.clubId;
    if (req.user.clubsManaged.includes(clubId)) {
        return next();
    }
    
    res.status(403).render('error', { 
        message: 'Club admin access required',
        user: req.user 
    });
};

module.exports = { isAdmin, isClubAdmin };