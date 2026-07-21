/**
 * Compatibility helper for project collaboration controller responses.
 * Bridges with the centralized response formatter middleware.
 */
const successResponse = (res, statusCode, message, data = null) => {
  return res.success(message, data, statusCode);
};

const errorResponse = (res, statusCode, message, error = null) => {
  return res.error(message, error, statusCode);
};

module.exports = {
  successResponse,
  errorResponse,
};
