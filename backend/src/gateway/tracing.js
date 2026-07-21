const { v4: uuidv4 } = require('uuid');

/**
 * Request Tracing Middleware
 * Injects a unique tracing ID (X-Request-ID) into headers for distributed tracking.
 */
const requestTracing = (req, res, next) => {
  const traceId = req.header('x-request-id') || req.header('x-correlation-id') || uuidv4();
  
  // Set in request context and response headers
  req.traceId = traceId;
  res.setHeader('X-Request-Id', traceId);
  
  next();
};

module.exports = requestTracing;
