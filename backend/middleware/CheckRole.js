const isAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'Admin') {
        return next();
    }
    res.status(403).json({ error: 'Admin access required' });
};

const isClubAdmin = async (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
    }
    
    if (req.user.role === 'Admin') {
        return next(); // Site admins can manage all clubs
    }

    // Check if user is admin of this specific club
    const clubId = req.params.clubId;
    if (req.user.clubsManaged.includes(clubId)) {
        return next();
    }
    
    res.status(403).json({ error: 'Club admin access required' });
};