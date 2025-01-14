/**
 * This file is used to validate the profile input fields.
 * @param {Request} req - The request object
 * @param {Response} res - The response object
 * @param {Function} next - The next middleware function
 * @returns {void}
 */
const validateProfileInput = (req, res, next) => {  
    const { firstName, lastName } = req.body;  
    if (!firstName || firstName.trim().length === 0) {  
        return res.status(400).send('First name is required');  
    }  
    next();  
};  
module.exports = { validateProfileInput };