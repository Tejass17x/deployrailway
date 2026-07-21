/**
 * Compatibility helper for project routes.
 * Bridges with the centralized auth.middleware.js and adds aliases.
 */
const original = require('../middlewares/auth.middleware');

module.exports = {
  ...original,
  authenticate: original.authMiddleware, // Alias for routes compatibility
};
