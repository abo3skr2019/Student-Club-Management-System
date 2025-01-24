const validateEventInput = (req, res, next) => {
    try {
        const { 
            name, 
            description, 
            poster, 
            location,
            seatsAvailable,
            category
        } = req.body;

        const errors = [];

        // Name validation
        if (!name || name.trim().length < 3 || name.trim().length > 100) {
            errors.push('Event name must be between 3 and 100 characters');
        }

        // Description validation
        if (!description || description.trim().length < 20 || description.trim().length > 1000) {
            errors.push('Description must be between 20 and 1000 characters');
        }

        // Poster URL validation
        const urlPattern = new RegExp(
            '^https?:\\/\\/.+\\..+'
        );
        if (!poster || !urlPattern.test(poster)) {
            errors.push('Valid poster URL is required');
        }

        // Location validation
        if (!location || location.trim().length < 3 || location.trim().length > 200) {
            errors.push('Location must be between 3 and 200 characters');
        }

        // Seats validation
        const seats = parseInt(seatsAvailable);
        if (isNaN(seats) || seats < 1 || seats > 10000) {
            errors.push('Available seats must be between 1 and 10,000');
        }

        // Category validation
        const validCategories = ['bootcamp', 'workshop', 'meeting', 'hackathon', 'seminar', 'conference', 'networking'];
        if (!category || !validCategories.includes(category)) {
            errors.push('Invalid event category');
        }

        if (errors.length > 0) {
            return res.status(400).render('error', {
                message: errors.join('. '),
                user: req.user
            });
        }

        next();
    } catch (err) {
        res.status(500).render('error', {
            message: 'Error validating event input',
            user: req.user
        });
    }
};

const validateEventDates = (req, res, next) => {
    try {
        const { registrationStart, registrationEnd, eventStart, eventEnd } = req.body;
        
        const regStart = new Date(registrationStart);
        const regEnd = new Date(registrationEnd);
        const evStart = new Date(eventStart);
        const evEnd = new Date(eventEnd);

        // Validate date relationships
        if (regEnd <= regStart) {
            return res.status(400).json({
                error: 'Registration end date must be after registration start date'
            });
        }

        if (evEnd <= evStart) {
            return res.status(400).json({
                error: 'Event end date must be after event start date'
            });
        }

        if (evStart <= regEnd) {
            return res.status(400).json({
                error: 'Event start date must be after registration end date'
            });
        }

        // Add validated dates to req object
        req.validatedEventDates = {
            registrationStart: regStart,
            registrationEnd: regEnd,
            eventStart: evStart,
            eventEnd: evEnd
        };

        next();
    } catch (err) {
        res.status(400).json({
            error: 'Invalid date format'
        });
    }
};

module.exports = { validateEventDates, validateEventInput };