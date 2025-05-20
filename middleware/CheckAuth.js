/**
 * Middleware to check if the user is authenticated
 * @param {Request} req - The request object
 * @param {Response} res - The response object
 * @param {Function} next - The next middleware function
 * @returns {void}
 */
const isAuthenticated = (req, res, next) => {
    if (process.env.NODE_ENV !== 'production') {
        console.log("NODE_ENV", process.env.NODE_ENV);
        const userIdHeader = req.headers['x-user-id'];
        const parsedId = Number.parseInt(userIdHeader, 10);  
        if (Number.isFinite(parsedId)) {  
            req.user = { id: parsedId };  
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
