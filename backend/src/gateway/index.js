const express = require('express');
const router = express.Router();

const requestTracing = require('./tracing');
const { helmetGateway, corsGateway } = require('./security');
const responseStandardizer = require('./response');
const rateLimiter = require('./limiter');
const healthRoutes = require('./health');
const { metricsMiddleware, metricsEndpointHandler } = require('../config/metrics');

// 1. Mount low-level middleware (tracing, metrics, security, standards)
router.use(requestTracing);
router.use(metricsMiddleware);
router.use(helmetGateway);
router.use(corsGateway);
router.use(responseStandardizer);

// 2. Mount Health & Metrics endpoints (bypasses rate limiting)
router.use('/health', healthRoutes);
router.get('/metrics', metricsEndpointHandler);

// 3. Mount Redis Rate Limiting (bypasses internal health endpoint but covers all standard APIs)
router.use(rateLimiter({ max: 200, windowMs: 60 * 1000 })); // default: 200 reqs/min

module.exports = router;
