const Club = require('../models/Club');
const { createError } = require('../utils/errors');

// Utility function to format club response
const formatClubResponse = (club) => {
    return {
        id: club._id,
        name: club.name,
        description: club.description,
        logo: club.logo,
        yearFounded: club.yearFounded,
        social_links: club.social_links,
        contact_email: club.contact_email
    };
};

module.exports = {
    // Fetch all clubs
    getAllClubs: async (req, res, next) => {
        try {
            const clubs = await Club.find();
            res.status(200).json(clubs.map(formatClubResponse));
        } catch (err) {
            next(createError(500, 'Error fetching clubs'));
        }
    },

    // Fetch specific club details
    getClubById: async (req, res, next) => {
        try {
            const club = await Club.findById(req.params.clubId).populate('events');

            if (!club) {
                return next(createError(404, 'Club not found'));
            }

            res.status(200).json({
                ...formatClubResponse(club),
                events: club.events
    });
        } catch (err) {
            next(createError(500, 'Error fetching club details'));
        }
    },

    // Create a new club
    createClub: async (req, res, next) => {
        try {
            // Mock admin check
            if (!req.isAdmin) {
                return res.status(403).json({ error: 'Admin access required' });
            }

            const club = new Club(req.body);
            await club.save();

            res.status(201).json({
                message: 'Club created.',
                club: formatClubResponse(club)
            });
        } catch (err) {
            if (err.code === 11000) { // MongoDB duplicate key error
                return next(createError(400, 'Club with this name already exists'));
            }
            next(createError(400, err.message));
        }
    },

    // Update a club's details
    updateClub: async (req, res, next) => {
        try {
            // Mock club admin check
            if (!req.isClubAdmin) {
                return res.status(403).json({ error: 'Club Admin access required' });
            }

            const club = await Club.findByIdAndUpdate(
                req.params.clubId,
                { $set: req.body },
                { new: true, runValidators: true }
            );

            if (!club) {
                return next(createError(404, 'Club not found'));
            }
            
            res.status(200).json({
                message: 'Club updated.',
                club: formatClubResponse(club)
            });
            
        } catch (err) {
            next(createError(400, err.message));
        }
    },

    // Assign a club admin
    assignClubAdmin: async (req, res, next) => {
        try {
            // Mock admin check
            if (!req.isAdmin || !req.isClubAdmin) {
                return res.status(403).json({ error: 'Admin/Club admin access required' });
            }

            const { userId } = req.body;
            const club = await Club.findById(req.params.clubId);

            if (!club) {
                return next(createError(404, 'Club not found'));
            }

            // TODO: Once User model is available:
            // 1. Verify user exists
            // 2. Update user's role to club_admin

            club.admin = userId;
            await club.save();

            res.status(200).json({
                message: 'Club admin assigned.',
                admin: {
                id: userId,
                // name and email will be added once User model is available
                }
            });
        } catch (err) {
            next(createError(400, err.message));
        }
    },
};