const Club = require('../models/Club');
const User = require('../models/User');
const { createError } = require('../utils/errors');

// Utility function to format club response
const formatClubResponse = (club) => {
    return {
        id: club._id,
        name: club.name,
        description: club.description,
        logo: club.logo
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
            const club = await Club.findById(req.params.clubId);
            //.populate('events');
            
            if (!club) {
                return next(createError(404, 'Club not found'));
            }

            res.status(200).json({
                ...formatClubResponse(club)
                //events: club.events
    });
        } catch (err) {
            next(createError(500, 'Error fetching club details'));
        }
    },

    // Create a new club
    createClub: async (req, res, next) => {
        try {
            const { name, description, logo, adminId } = req.body;

            // Validate admin user exists
            const adminUser = await User.findById(adminId);
            if (!adminUser) {
                return next(createError(404, 'Specified admin user not found'));
            }

            // Check if name already exist
            const existingClub = await Club.findOne({ name: new RegExp(`^${name}$`, 'i') });
            if (existingClub) {
                return next(createError(400, 'Club with this name already exists'));
            }

            // Create Club
            const club = new Club({
                name,
                description,
                logo,
                admin: adminId
            });
            await club.save();

            // Update admin's clubsManaged
            adminUser.clubsManaged.push(club._id);
            await adminUser.save();

            res.status(201).json({
                message: 'Club created.',
                club: formatClubResponse(club)
            });
        } catch (err) {
            next(createError(400, err.message));
        }
    },

    // Update a club's details
    updateClub: async (req, res, next) => {
        try {
            // Check if name already exist
            const { name } = req.body;
            const existingClub = await Club.findOne({ 
                name: new RegExp(`^${name}$`, 'i'),
                _id: { $ne: req.params.clubId } // Exclude the current club from the search
            });
            if (existingClub) {
                return next(createError(400, 'Club with this name already exists'));
            }

            // Update Club
            const club = await Club.findByIdAndUpdate(
                req.params.clubId,
                { $set: req.body },
                { new: true, runValidators: true }
            );

            // Handle Club doesn't exist
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
            const { clubId } = req.params;
            const { email } = req.body;  // New admin's email
    
            // Validate provided email
            if (!email || !/.+\@.+\..+/.test(email)) {
                return next(createError(400, 'Valid email is required'));
            }
    
            // Find the club
            const club = await Club.findById(clubId);
            if (!club) {
                return next(createError(404, 'Club not found'));
            }
    
            // Find the new admin by email
            const newAdmin = await User.findOne({ email: email });
            if (!newAdmin) {
                return next(createError(404, 'User with this email not found'));
            }
    
            // Check if new admin is already admin of this club
            if (club.admin.toString() === newAdmin._id.toString()) {
                return next(createError(400, 'User is already admin of this club'));
            }
    
            // Update old admin's clubsManaged
            const oldAdmin = await User.findById(club.admin);
            if (oldAdmin) {
                oldAdmin.clubsManaged = oldAdmin.clubsManaged.filter(
                    id => id.toString() !== clubId
                );
                
                // Update old admin's role if they don't manage any other clubs
                if (oldAdmin.clubsManaged.length === 0 && oldAdmin.role === 'ClubAdmin') {
                    oldAdmin.role = 'Visitor';
                }
                await oldAdmin.save();
            }
    
            // Update new admin's clubsManaged and role
            if (!newAdmin.clubsManaged.includes(clubId)) {
                newAdmin.clubsManaged.push(clubId);
            }
            if (newAdmin.role === 'Member' || newAdmin.role === 'Visitor') {
                newAdmin.role = 'ClubAdmin';
            }
            await newAdmin.save();
    
            // Update club's admin
            club.admin = newAdmin._id;
            await club.save();
    
            res.status(200).json({
                message: 'Club admin updated successfully',
                club: {
                    ...formatClubResponse(club),
                    admin: {
                        id: newAdmin._id,
                        email: newAdmin.email,
                        displayName: newAdmin.displayName
                    }
                }
            });
    
        } catch (err) {
            next(createError(500, 'Error assigning club admin: ' + err.message));
        }
    },
};