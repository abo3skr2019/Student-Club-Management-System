const validateProfileInput = (req, res, next) => {  
    const { firstName, lastName } = req.body;  
    if (!firstName || firstName.trim().length === 0) {  
        return res.status(400).send('First name is required');  
    }  
    next();  
};  
module.exports = validateProfileInput;