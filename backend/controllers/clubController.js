const Club = require('../models/Club');
const User = require('../models/User');
const { createError } = require('../utils/errors');

module.exports = {
    // Render all clubs
    getAllClubs: async (req, res) => {
        try {
            const clubs = await Club.find().populate('clubAdmin', 'displayName email');
            res.render('clubs/index', { 
                clubs,
                user: req.user 
            });
        } catch (err) {
            console.error(err);
            res.status(500).render('error', { 
                message: 'Error fetching clubs',
                user: req.user 
            });
        }
    },

    // Render specific club details
    getClubById: async (req, res) => {
        try {
            const club = await Club.findById(req.params.clubId)
            .populate('clubAdmin', 'displayName email');
            // populate('createdEvents'); #TODO!
            
            if (!club) {
                return res.status(404).render('error', { 
                    message: 'Club not found',
                    user: req.user 
                });
            }

            res.render('clubs/detail', { 
                club,
                user: req.user 
            });
        } catch (err) {
            console.error(err);
            res.status(500).render('error', { 
                message: 'Error fetching club details',
                user: req.user 
            });
        }
    },

    // Render club creation form
    renderCreateClubForm: async (req, res) => {
        res.render('clubs/create', { 
            user: req.user 
        });
    },

    // Create a new club
    createClub: async (req, res) => {
        try {
            const { name, description, logo } = req.body;

            // Check if name already exists
            const existingClub = await Club.findOne({ 
                name: new RegExp(`^${name}$`, 'i') 
            });
            
            if (existingClub) {
                return res.render('clubs/create', { 
                    error: 'Club with this name already exists',
                    user: req.user 
                });
            }

            // Create Club
            const club = new Club({
                name,
                description,
                logo,
                clubAdmin: req.user._id
            });
            await club.save();

            // Update admin's clubsManaged
            req.user.clubsManaged.push(club._id);
            await req.user.save();

            res.redirect(`/clubs/${club._id}`);
        } catch (err) {
            console.error(err);
            res.render('clubs/create', { 
                error: err.message,
                user: req.user 
            });
        }
    },

    // Render club edit form
    renderEditClubForm: async (req, res) => {
        try {
            const club = await Club.findById(req.params.clubId);
            
            if (!club) {
                return res.status(404).render('error', { 
                    message: 'Club not found',
                    user: req.user 
                });
            }

            res.render('clubs/edit', { 
                club,
                user: req.user 
            });
        } catch (err) {
            console.error(err);
            res.status(500).render('error', { 
                message: 'Error loading edit form',
                user: req.user 
            });
        }
    },

    // Update a club's details
    updateClub: async (req, res) => {
        try {
            const { name, description, logo } = req.body;
            
            // Check if name already exists
            const existingClub = await Club.findOne({ 
                name: new RegExp(`^${name}$`, 'i'),
                _id: { $ne: req.params.clubId } // Exclude the current club from the search
            });

            if (existingClub) {
                return res.render('clubs/edit', { 
                    club: { _id: req.params.clubId, name, description, logo },
                    error: 'Club with this name already exists',
                    user: req.user 
                });
            }

            // Update Club
            const club = await Club.findByIdAndUpdate(
                req.params.clubId,
                { $set: { name, description, logo } },
                { new: true, runValidators: true }
            );

            // Handle Club doesn't exist
            if (!club) {
                return res.status(404).render('error', { 
                    message: 'Club not found',
                    user: req.user 
                });
            }
            
            res.redirect(`/clubs/${club._id}`);
            
        } catch (err) {
            console.error(err);
            res.render('clubs/edit', { 
                club: { _id: req.params.clubId, ...req.body },
                error: err.message,
                user: req.user 
            });
        }
    },

    // Render Assign Admin
    renderAssignAdmin: async (req, res) => {
        try {
            const club = await Club.findById(req.params.clubId)
                .populate('clubAdmin', 'displayName email');
            
            if (!club) {
                return res.render('error', { 
                    message: 'Club not found',
                    user: req.user 
                });
            }

            res.render('clubs/assign-admin', { 
                club,
                user: req.user 
            });
        } catch (err) {
            console.error(err);
            res.render('error', { 
                message: 'Error loading assign admin form',
                user: req.user 
            });
        }
    },

    // Assign a club admin
    assignClubAdmin: async (req, res, next) => {
        try {
            const { clubId } = req.params;
            const { email } = req.body;  // New admin's email
    
            // Validate provided email
            if (!email || !/.+\@.+\..+/.test(email)) {
                return res.render('error', { 
                    message: 'Email not valid',
                    user: req.user 
                });
            }
    
            // Find the club
            const club = await Club.findById(clubId);
            if (!club) {
                return res.render('error', { 
                    message: 'Club not found',
                    user: req.user 
                });
            }
    
            // Find the new admin by email
            const newAdmin = await User.findOne({ email: email });
            if (!newAdmin) {
                return res.render('clubs/assign-admin', {
                    club,
                    error: 'User with this email not found',
                    user: req.user
                });
            }
    
            // Check if new admin is already admin of this club
            if (club.clubAdmin.toString() === newAdmin._id.toString()) {
                return next(createError(400, 'User is already admin of this club'));
            }
    
            // Update old admin's clubsManaged
            const oldAdmin = await User.findById(club.clubAdmin);
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
            club.clubAdmin = newAdmin._id;
            await club.save();
    
            res.redirect(`/clubs/${clubId}`);
    
        } catch (err) {
            next(createError(500, 'Error assigning club admin: ' + err.message));
        }
    },
};