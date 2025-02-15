const Ticket = require('../models/Ticket');

/**
 * GET /
 * Home page
 */
const getIndex = (req, res) => {
    res.render('index',
         { 
            extraCSS: '<link href="/css/index.css" rel="stylesheet">' 
         });
}

/**
 * GET /dashboard
 * Dashboard
*/
const getTicketDashboard = async (req, res) => {
    try {
        const tickets = await Ticket.find({})
            .populate('createdBy', 'displayName email') // Populate creator info
            .select('title description category priority status createdAt createdBy') // Explicitly select fields
            .lean();

        // Add creator display information
        const ticketsWithCreator = tickets.map(ticket => ({
            ...ticket,
            creatorDisplay: ticket.createdBy ? 
                ticket.createdBy.displayName : 
                'Anonymous'
        }));

        const locals = {
            title: "Dashboard",
            description: "View all tickets",
        };

        res.render('ticket-dashboard', {
            locals,
            tickets: ticketsWithCreator
        });

    } catch (error) {
        console.log(error);
        res.status(500).send("Error fetching tickets");
    }
};

/*
Get /contact
Contact page
*/
const getContact = async (req, res) => {
    const locals = {
        title: "Contact",
        description: "Contact us page",
    };
    res.render("contact", locals);
}

/*
POST /contact
Handle contact form submission
*/
const submitContact = async (req, res) => {
    try {
        const ticketData = {
            title: req.body.title,
            description: req.body.description,
            category: req.body.category,
            priority: req.body.priority,
            status: "open"
        };

        // If user is authenticated, add their ID
        if (req.user) {
            ticketData.createdBy = req.user._id;
        } else {
            // For anonymous users, set createdBy to null
            ticketData.createdBy = null;
        }

        const ticket = new Ticket(ticketData);
        await ticket.save();
        res.redirect('/contact?success=true');
    } catch (error) {
        console.log(error);
        res.redirect('/contact?error=true');
    }
}

module.exports = {
    getIndex,
    getTicketDashboard,
    getContact,
    submitContact
};
