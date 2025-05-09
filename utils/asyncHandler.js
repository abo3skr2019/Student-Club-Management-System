/**
 * Wraps an async controller function to automatically forward errors to Express's next()
 * This eliminates the need for try/catch blocks in every controller
 *
 * @param {Function} fn - Async controller function
 * @returns {Function} Express middleware function that handles async errors
 */
module.exports = (fn) => (req, res, next) =>
    Promise.resolve(fn(req, res, next)).catch(next);
