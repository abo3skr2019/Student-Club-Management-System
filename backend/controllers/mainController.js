const { db } = require('../../dist/db');
const { ticket } = require('../../dist/db/schema');
const { eq } = require('drizzle-orm');
const { insertTicketSchema } = require('../../dist/db/schema/ticket');

/**
 * GET /
 * Home page
 */
const getIndex = (req, res) => {
    res.render('index', {
        extraCSS: '<link href="/css/index.css" rel="stylesheet">',
    });
};

/**
 * GET /admin/Tickets
 * Dashboard
 */
const getTicketDashboard = async (req, res) => {
    try {
        const tickets = await db.query.ticket.findMany({
            with: {
                createdBy: {
                    columns: {
                        displayName: true,
                        email: true,
                    },
                },
            },
            orderBy: (ticket, { desc }) => [desc(ticket.createdAt)],
        });

        // Add creator display information
        const ticketsWithCreator = tickets.map((ticket) => ({
            ...ticket,
            creatorDisplay: ticket.createdBy
                ? ticket.createdBy.displayName
                : 'Anonymous',
        }));

        const locals = {
            title: 'Dashboard',
            description: 'View all tickets',
        };

        res.render('ticket-dashboard', {
            locals,
            tickets: ticketsWithCreator,
        });
    } catch (error) {
        console.error('Error fetching tickets:', error);
        res.status(500).render('error', {
            message: 'Error fetching tickets',
            user: req.user,
        });
    }
};

/*
Get /contact
Contact page
*/
const getContact = async (req, res) => {
    const locals = {
        title: 'Contact',
        description: 'Contact us page',
    };
    res.render('contact', locals);
};

/*
POST /contact
Handle contact form submission
*/
const submitContact = async (req, res) => {
    try {
        // Validate the request body
        const validatedData = insertTicketSchema.safeParse({
            ...req.body,
            status: 'open',
            createdBy: req.user?.id || null,
        });

        if (!validatedData.success) {
            console.error('Validation error:', validatedData.error);
            return res.redirect('/contact?error=true');
        }

        // Insert the ticket
        await db.insert(ticket).values(validatedData.data);

        res.redirect('/contact?success=true');
    } catch (error) {
        console.error('Error creating ticket:', error);
        res.redirect('/contact?error=true');
    }
};

module.exports = {
    getIndex,
    getTicketDashboard,
    getContact,
    submitContact,
};
