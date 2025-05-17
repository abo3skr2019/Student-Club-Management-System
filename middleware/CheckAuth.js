/**
 * Middleware to check if the user is authenticated
 * @param {Request} req - The request object
 * @param {Response} res - The response object
 * @param {Function} next - The next middleware function
 * @returns {void}
 */
const isAuthenticated = (req, res, next) => {
    if (process.env.NODE_ENV !== 'production') {
        // Bypass authentication for Test purposes
        return next();
    }
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect('/login');
};

module.exports = { isAuthenticated };
