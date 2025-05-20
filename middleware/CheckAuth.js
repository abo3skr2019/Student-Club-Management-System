/**
 * Middleware to check if the user is authenticated
 * @param {Request} req - The request object
 * @param {Response} res - The response object
 * @param {Function} next - The next middleware function
 * @returns {void}
 */
const isAuthenticated = async (req, res, next) => {
    if (process.env.NODE_ENV !== 'production') {
        const userIdHeader = req.headers['x-user-id'];
        const parsedId = Number.parseInt(userIdHeader, 10);  
        if (Number.isFinite(parsedId)) {  
            // Add minimal user object with ID
            req.user = { id: parsedId };  
            
            // Explicitly fetch and attach user data here instead of relying on global middleware order
            try {
                const { db } = require('../dist/db');
                const { user } = require('../dist/db/schema');
                const { eq } = require('drizzle-orm');
                
                // Fetch full user data from database
                const userData = await db.query.user.findFirst({
                    where: eq(user.id, parsedId),
                });
                
                if (userData) {
                    // Replace the minimal user object with the complete user data
                    req.user = userData;
                }
            } catch (error) {
                console.error('Error fetching test user data in isAuthenticated:', error);
                // Continue even if there's an error
            }
        }  

        // Bypass authentication for Test purposes
        return next();
    }
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect('/login');
};

module.exports = { isAuthenticated };
