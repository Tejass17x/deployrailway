/**
 * Response Standardization Middleware
 * Ensures every API response follows the enterprise format matching user specification.
 */
const responseStandardizer = (req, res, next) => {
  res.success = (message, data = null) => {
    return res.status(200).json({
      success: true,
      message: message || 'Success',
      data,
      error: null
    });
  };

  res.error = (statusCode, message, errorDetails = {}) => {
    return res.status(statusCode || 500).json({
      success: false,
      message: message || 'Something went wrong.',
      error: errorDetails
    });
  };

  next();
};

module.exports = responseStandardizer;
