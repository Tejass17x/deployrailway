const client = require('prom-client');
const logger = require('../common/logger/winston');

// Enable default metrics collection (CPU, Memory, Event Loop Lag, etc.)
const collectDefaultMetrics = client.collectDefaultMetrics;
collectDefaultMetrics({ register: client.register });

// Custom Prometheus Metrics
const httpRequestsTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests processed',
  labelNames: ['method', 'route', 'status']
});

const httpRequestDurationMilliseconds = new client.Histogram({
  name: 'http_request_duration_ms',
  help: 'Duration of HTTP requests in milliseconds',
  labelNames: ['method', 'route', 'status'],
  buckets: [5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000]
});

/**
 * Express middleware to track HTTP requests and duration metrics
 */
const metricsMiddleware = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const route = req.route ? req.route.path : req.path;
    
    // Increment request counter
    httpRequestsTotal.inc({
      method: req.method,
      route: route,
      status: res.statusCode
    });
    
    // Record duration histogram
    httpRequestDurationMilliseconds.observe({
      method: req.method,
      route: route,
      status: res.statusCode
    }, duration);
  });
  
  next();
};

/**
 * Request handler for exposing metrics to Prometheus scraper
 */
const metricsEndpointHandler = async (req, res) => {
  try {
    res.set('Content-Type', client.register.contentType);
    res.end(await client.register.metrics());
  } catch (err) {
    logger.error('Failed to generate Prometheus metrics:', err);
    res.status(500).end(err.message);
  }
};

module.exports = {
  metricsMiddleware,
  metricsEndpointHandler
};
