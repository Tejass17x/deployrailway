const logger = require('../common/logger/winston');

class CircuitBreaker {
  constructor(serviceName, options = {}) {
    this.serviceName = serviceName;
    this.failureThreshold = options.failureThreshold || 5; // failures before tripping
    this.cooldownPeriod = options.cooldownPeriod || 30000; // time in ms before transitioning from open to half-open
    this.requestTimeout = options.requestTimeout || 15000; // time before request is considered failed (15s)
    
    this.state = 'CLOSED'; // CLOSED, OPEN, HALF-OPEN
    this.failures = 0;
    this.lastFailureTime = null;
  }

  execute(req, res, next) {
    if (this.state === 'OPEN') {
      const now = Date.now();
      if (now - this.lastFailureTime > this.cooldownPeriod) {
        this.state = 'HALF-OPEN';
        logger.warn(`[CIRCUIT BREAKER] Service ${this.serviceName} transitioned to HALF-OPEN. Probing...`);
      } else {
        logger.error(`[CIRCUIT BREAKER] Service ${this.serviceName} is OPEN. Denying request for protection.`);
        return res.status(503).json({
          success: false,
          message: 'Service is temporarily unavailable. Circuit breaker activated.',
          error: { code: 'SERVICE_UNAVAILABLE', service: this.serviceName }
        });
      }
    }

    // Set request timeout guard
    const timer = setTimeout(() => {
      this.onFailure('Timeout');
      if (!res.headersSent) {
        res.status(504).json({
          success: false,
          message: `Request timeout. Service ${this.serviceName} took too long to respond.`,
          error: { code: 'GATEWAY_TIMEOUT' }
        });
      }
    }, this.requestTimeout);

    // Patch res.end to track success / failure and clear timeout
    const originalEnd = res.end;
    const self = this;
    res.end = function (...args) {
      clearTimeout(timer);
      res.end = originalEnd;
      
      const statusCode = res.statusCode;
      if (statusCode >= 500) {
        self.onFailure(`HTTP ${statusCode}`);
      } else {
        self.onSuccess();
      }
      
      return res.end(...args);
    };

    next();
  }

  onSuccess() {
    this.failures = 0;
    if (this.state === 'HALF-OPEN') {
      this.state = 'CLOSED';
      logger.info(`[CIRCUIT BREAKER] Service ${this.serviceName} resolved. Transited to CLOSED.`);
    }
  }

  onFailure(reason) {
    this.failures++;
    this.lastFailureTime = Date.now();
    logger.warn(`[CIRCUIT BREAKER] Service ${this.serviceName} failure (${reason}). Total failures: ${this.failures}/${this.failureThreshold}`);

    if (this.failures >= this.failureThreshold) {
      this.state = 'OPEN';
      logger.error(`[CIRCUIT BREAKER] Service ${this.serviceName} tripped to OPEN. Restricting traffic.`);
    }
  }
}

// Instantiate breakers for key modules
const breakers = {
  scholar: new CircuitBreaker('Google Scholar API'),
  collaboration: new CircuitBreaker('Collaboration Engine'),
  general: new CircuitBreaker('Backend Server')
};

const circuitBreakerMiddleware = (service = 'general') => {
  const breaker = breakers[service] || breakers.general;
  return (req, res, next) => breaker.execute(req, res, next);
};

module.exports = {
  CircuitBreaker,
  circuitBreakerMiddleware
};
