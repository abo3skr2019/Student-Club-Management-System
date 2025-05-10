/**
 * Utilities for building DB queries from parsed request filters
 */
const {
    eq,
    ne,
    gt,
    gte,
    lt,
    lte,
    inArray,
    notInArray,
} = require('drizzle-orm');
const createError = require('http-errors');

/**
 * Translate parsedQuery.filters into Drizzle conditions
 * @param {Object} filters - Object of the format { field: { op: value, ... }, ... }
 * @param {Object} model - Drizzle schema model (e.g., club, clubMembership)
 * @returns {Array} Array of Drizzle condition expressions
 */
function buildFilterConditions(filters = {}, model) {
    const conditions = [];

    for (const [field, ops] of Object.entries(filters)) {
        if (!model[field]) continue; // Skip if field doesn't exist on model

        for (const [op, value] of Object.entries(ops)) {
            switch (op) {
                case 'eq':
                    conditions.push(eq(model[field], value));
                    break;
                case 'neq':
                    conditions.push(ne(model[field], value));
                    break;
                case 'gt':
                    conditions.push(gt(model[field], value));
                    break;
                case 'gte':
                    conditions.push(gte(model[field], value));
                    break;
                case 'lt':
                    conditions.push(lt(model[field], value));
                    break;
                case 'lte':
                    conditions.push(lte(model[field], value));
                    break;
                case 'in':
                    conditions.push(
                        inArray(
                            model[field],
                            Array.isArray(value) ? value : [value],
                        ),
                    );
                    break;
                case 'nin':
                    conditions.push(
                        notInArray(
                            model[field],
                            Array.isArray(value) ? value : [value],
                        ),
                    );
                    break;
                default:
                    throw createError(400, `Invalid filter operator: ${op}`);
            }
        }
    }

    return conditions;
}

module.exports = {
    buildFilterConditions,
};
