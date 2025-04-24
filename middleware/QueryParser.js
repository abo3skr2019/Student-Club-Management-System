/**
 * Middleware to secure, sanitize, and parse query parameters
 * @param {Request} req - The request object
 * @param {Response} res - The response object
 * @param {Function} next - The next middleware function
 * @returns {void}
 */
const parseQueryParams = (req, res, next) => {
    try {
        // Step 1: Security checks
        const securityError = checkQuerySecurity(req.query);
        if (securityError) {
            return res.status(400).json({
                status: 'error',
                error: securityError,
            });
        }

        // Step 2: Sanitize query
        const sanitizedQuery = sanitizeQuery(req.query);

        // Step 3: Parse into structured format
        const parsedQuery = {
            pagination: parsePagination(sanitizedQuery),
            sort: parseSortParams(sanitizedQuery.sort),
            fields: parseFields(sanitizedQuery.fields),
            include: parseIncludes(sanitizedQuery.include),
            filters: parseFilters(sanitizedQuery),
            search: sanitizedQuery.search || undefined,
        };

        // Attach the parsed query to the request object
        req.parsedQuery = parsedQuery;
        next();
    } catch (error) {
        next(error);
    }
};

/**
 * Check query parameters for security issues
 * @param {Object} query - Query parameters
 * @returns {Object|null} Error object if security issues found, null otherwise
 */
function checkQuerySecurity(query) {
    const dangerousPatterns = /[<>{}$]/;
    const MAX_QUERY_LENGTH = 100;

    for (const [key, value] of Object.entries(query)) {
        if (typeof value === 'string') {
            if (dangerousPatterns.test(value)) {
                return {
                    code: 'INVALID_CHARACTERS',
                    message: 'Query contains invalid characters',
                };
            }
            if (value.length > MAX_QUERY_LENGTH) {
                return {
                    code: 'QUERY_TOO_LONG',
                    message: `Query parameter ${key} exceeds maximum length`,
                };
            }
        }
    }
    return null;
}

/**
 * Sanitize query parameters
 * @param {Object} query - Query parameters
 * @returns {Object} Sanitized query parameters
 */
function sanitizeQuery(query) {
    const sanitized = { ...query };

    // Remove empty values
    Object.keys(sanitized).forEach((key) => {
        if (typeof sanitized[key] === 'string') {
            // Remove surrounding quotes (both single and double)
            sanitized[key] = sanitized[key].replace(/^["'](.*)["']$/, '$1');

            // Trim whitespace
            sanitized[key] = sanitized[key].trim();

            // Remove if empty, 'null', or 'undefined'
            if (
                sanitized[key] === '' ||
                sanitized[key] === 'null' ||
                sanitized[key] === 'undefined'
            ) {
                delete sanitized[key];
            }
        }
    });

    return sanitized;
}

/**
 * Parse pagination parameters
 * @param {Object} query - Express query object
 * @returns {Object} Pagination object with page and limit
 */
function parsePagination(query) {
    const page = Math.max(1, parseInt(query.page) || 1);
    const limit = Math.min(Math.max(1, parseInt(query.limit) || 10), 50);
    return { page, limit };
}

/**
 * Parse sort parameters
 * @param {string} sortString - Comma-separated sort fields
 * @returns {Object} Sort object with field-order pairs
 */
function parseSortParams(sortString = '') {
    if (!sortString) return {};

    return sortString.split(',').reduce((acc, field) => {
        const order = field.startsWith('-') ? 'desc' : 'asc';
        const key = field.replace(/^-/, '');
        return { ...acc, [key]: order };
    }, {});
}

/**
 * Parse fields for selection
 * @param {string} fieldsString - Comma-separated field names
 * @returns {Array} Array of field names
 */
function parseFields(fieldsString = '') {
    return fieldsString ? fieldsString.split(',').filter(Boolean) : [];
}

/**
 * Parse relations to include
 * @param {string} includeString - Comma-separated relation names
 * @returns {Array} Array of relation names
 */
function parseIncludes(includeString = '') {
    return includeString ? includeString.split(',').filter(Boolean) : [];
}

/**
 * Parse filter parameters including operators
 * @param {Object} query - Express query object
 * @returns {Object} Structured filters object
 */
function parseFilters(query) {
    const filters = {};
    const excludedParams = [
        'page',
        'limit',
        'sort',
        'fields',
        'include',
        'search',
    ];

    Object.entries(query).forEach(([key, value]) => {
        if (excludedParams.includes(key)) return;

        const operatorMatch = key.match(/^(\w+)\[(\w+)\]$/);

        if (operatorMatch) {
            const [, field, operator] = operatorMatch;
            if (!filters[field]) filters[field] = {};

            if (['in', 'nin'].includes(operator)) {
                filters[field][operator] = value.split(',');
            } else {
                filters[field][operator] = value;
            }
        } else {
            filters[key] = value;
        }
    });

    return filters;
}

module.exports = { parseQueryParams };
