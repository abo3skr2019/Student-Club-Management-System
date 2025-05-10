/**
 * Middleware for validating request bodies using Zod schemas
 * Validates and transforms request body early in the request pipeline
 * to prevent invalid data from reaching controllers and services
 */
const { ZodError } = require('zod');
const createError = require('http-errors');

/**
 * Creates middleware that validates request body against a Zod schema
 * @param {import('zod').ZodSchema} schema - Zod schema to validate against
 * @returns {Function} Express middleware
 */
function validateBody(schema) {
    return (req, res, next) => {
        try {
            // Check for empty body
            if (Object.keys(req.body).length === 0) {
                return next(createError(400, 'Request body cannot be empty'));
            }

            // Parse and validate body with schema
            // This will transform data types and run all validations
            req.body = schema.parse(req.body);

            next();
        } catch (err) {
            if (err instanceof ZodError) {
                // Format Zod errors into a readable message
                const issues = err.errors
                    .map((e) => {
                        // Include the path to the field with the error
                        const path = e.path.join('.');
                        return `${path ? path + ': ' : ''}${e.message}`;
                    })
                    .join('; ');

                return next(createError(400, `Validation failed: ${issues}`));
            }

            // Pass through any other errors
            next(err);
        }
    };
}

module.exports = validateBody;
