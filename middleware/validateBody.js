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
            // For partial updates (like PATCH or PUT with partial data),
            // we don't require a non-empty body
            const isPartialSchema = schema._def && schema._def.description && 
                schema._def.description.includes('partial');
                
            // Check for empty body (only for non-partial schemas)
            if (!isPartialSchema && Object.keys(req.body).length === 0) {
                return next(createError(400, 'Request body cannot be empty'));
            }
            
            // Clean up empty strings for date fields to prevent invalid date errors
            const cleanBody = {...req.body};
            ['registrationStart', 'registrationEnd', 'eventStart', 'eventEnd'].forEach(field => {
                if (cleanBody[field] === '') {
                    delete cleanBody[field];
                }
            });
            
            // Parse and validate body with schema
            // This will transform data types and run all validations
            req.body = schema.parse(cleanBody);

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

                return res.status(400).json({
                    success: false,
                    error: JSON.stringify(err.errors, null, 2)
                });
            }

            // Pass through any other errors
            next(err);
        }
    };
}

module.exports = validateBody;
