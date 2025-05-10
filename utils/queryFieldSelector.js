/**
 * Utilities for selecting specific fields in database queries
 */

/**
 * Build a `columns` object for Drizzle from a list of field names
 * @param {string[]} fields Array of requested field names
 * @param {Object} model Drizzle schema model (e.g., club, clubMembership)
 * @returns {Object|undefined} A `{ colName: true, ... }` map or undefined if no fields specified
 */
function buildSelectFields(fields = [], model) {
    // If no fields specified, return undefined so Drizzle selects all columns
    if (!fields.length) return undefined;

    // Reduce the array of names into an object with { fieldName: true } format
    return fields.reduce((cols, fieldName) => {
        // Only include columns that actually exist on the model
        if (model[fieldName]) {
            cols[fieldName] = true;
        }
        return cols;
    }, {});
}

module.exports = {
    buildSelectFields,
};
