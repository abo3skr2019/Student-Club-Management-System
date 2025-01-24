const Club = require('../models/Club');
const User = require('../models/User');


/**
 * Render all clubs
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {void}
 */
const getAllClubs = async (req, res) => {
    try {
        const clubs = await Club.find().populate('clubAdmin', 'displayName email');
        res.render('clubs/club-list', { 
            clubs,
            user: req.user 
        });
    } catch (err) {
        res.status(500).render('error', { 
            message: 'Error fetching clubs',
            user: req.user 
        });
    }
}

/**
 * Render a club by its ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {void}
 */
const getClubById = async (req, res) => {
    try {
        const club = await Club.findOne({ uuid: req.params.clubId })
        .populate('clubAdmin', 'displayName email');
        // populate('createdEvents'); #TODO!
        
        if (!club) {
            return res.status(404).render('error', { 
                message: 'Club not found',
                user: req.user
            });
        }

        res.render('clubs/club-details', { 
            club,
            user: req.user,
            error: req.query.error,
            email: req.query.email
        });
    } catch (err) {
        res.status(500).render('error', { 
            message: 'Error fetching club details',
            user: req.user 
        });
    }
}

/**
 * Render Club Creation Form
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {void}
 */
const renderCreateClubForm = async (req, res) => {
    try {
        res.render('clubs/create-club', { 
            user: req.user 
        });
    } catch (err) {
        res.status(500).render('error', {
            message: 'Error loading form',
            user: req.user
        });
    }
}

/**
 * Create a new club
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {void}
 */
const createClub = async (req, res) => {
    try {
        const { name, description, logo } = req.body;

        // Check if name already exists
        const existingClub = await Club.findOne({ 
            name: new RegExp(`^${name}$`, 'i') 
        });
        
        if (existingClub) {
            return res.render('clubs/create-club', { 
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

        res.redirect(`/clubs/${club.uuid}`);
    } catch (err) {
        res.render('clubs/create-club', { 
            error: err.message,
            user: req.user 
        });
    }
}
/**
 * Render Edit Club Form
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {void}
 * @throws {Error} - If club not found
 * @throws {Error} - If error loading form
 */
const renderEditClubForm = async (req, res) => {
    try {
        const club = await Club.findOne({ uuid: req.params.clubId });
        
        if (!club) {
            return res.status(404).render('error', { 
                message: 'Club not found',
                user: req.user 
            });
        }

        res.render('clubs/update-club', { 
            club,
            user: req.user 
        });
    } catch (err) {
        res.status(500).render('error', { 
            message: 'Error loading edit form',
            user: req.user 
        });
    }
}

/**
 * Update a club
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {void}
 * @throws {Error} - If club not found
 * @throws {Error} - If club name already exists
 */
const updateClub = async (req, res) => {
    try {
        const { name, description, logo } = req.body;
        
        // Check if name already exists
        const existingClub = await Club.findOne({ 
            name: new RegExp(`^${name}$`, 'i'),
            uuid: { $ne: req.params.clubId } // Exclude the current club from the search
        });

        if (existingClub) {
            return res.render('clubs/update-club', { 
                club: { uuid: req.params.clubId, name, description, logo },
                error: 'Club with this name already exists',
                user: req.user 
            });
        }

        // Update Club
        const club = await Club.findOneAndUpdate(
            { uuid: req.params.clubId },
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
        
        res.redirect(`/clubs/${club.uuid}`);
        
    } catch (err) {
        res.render('clubs/update-club', { 
            club: { uuid: req.params.clubId, ...req.body },
            error: err.message,
            user: req.user 
        });
    }
}

/**
 * Render Assign Club Admin Form
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {void}
 * @throws {Error} - If club not found
 * @throws {Error} - If error loading form
 */
const renderAssignClubAdmin = async (req, res) => {
    try {
        const club = await Club.findOne({ uuid: req.params.clubId })
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
        res.render('error', { 
            message: 'Error loading assign admin form',
            user: req.user 
        });
    }
}

/**
 * Assign a new club admin
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {void}
 * @throws {Error} - If email not valid
 * @throws {Error} - If club not found
 * @throws {Error} - If user not found
 * @throws {Error} - If user is already an admin of this club
*/
const assignClubAdmin = async (req, res) => {
    try {
        const { clubId } = req.params;
        const { email } = req.body;  // New admin's email

        // Validate provided email
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return res.redirect(`/clubs/${clubId}?error=invalid_email&email=${encodeURIComponent(email)}`);
        }

        // Find the club
        const club = await Club.findOne({ uuid: clubId });
        if (!club) {
            return res.redirect(`/clubs/${clubId}?error=club_not_found`);
        }

        // Find the new admin by email
        const newAdmin = await User.findOne({ email: email });
        if (!newAdmin) {
            return res.redirect(`/clubs/${clubId}?error=user_not_found&email=${encodeURIComponent(email)}`);
        }

        // Check if new admin is already admin of this club
        if (club.clubAdmin?.toString() === newAdmin._id.toString()) {
            return res.redirect(`/clubs/${clubId}?error=already_admin&email=${encodeURIComponent(email)}`);
        }

        // Update old admin's clubsManaged
        const oldAdmin = await User.findById(club.clubAdmin);
        if (oldAdmin) {
            oldAdmin.clubsManaged = oldAdmin.clubsManaged.filter(
                id => id.toString() !== club._id.toString()
            );
            
            // Update old admin's role if they don't manage any other clubs
            if (oldAdmin.clubsManaged.length === 0 && oldAdmin.role === 'ClubAdmin') {
                oldAdmin.role = 'Visitor';
            }
            await oldAdmin.save();
        }

        // Update new admin's clubsManaged and role
        if (!newAdmin.clubsManaged.includes(club._id)) {
            newAdmin.clubsManaged.push(club._id);
        }
        if (newAdmin.role === 'Member' || newAdmin.role === 'Visitor') {
            newAdmin.role = 'ClubAdmin';
        }
        await newAdmin.save();

        // Update club's admin
        club.clubAdmin = newAdmin._id;
        await club.save();

        res.redirect(`/clubs/${club.uuid}?success=admin_assigned`);

    } catch (err) {
        res.render('error', { 
            message: 'Error loading assign admin form',
            user: req.user 
        });
    }
}

module.exports = {
    getAllClubs,
    getClubById,
    renderCreateClubForm,
    createClub,
    renderEditClubForm,
    updateClub,
    renderAssignClubAdmin,
    assignClubAdmin
}
