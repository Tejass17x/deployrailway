const helmet = require('helmet');
const cors = require('cors');
const env = require('../config/environment');

const configureHelmet = () => {
  return helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "blob:", "https:", env.r2?.publicUrl || "*"],
        connectSrc: ["'self'", "https:", "wss:", "ws:"],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: []
      }
    },
    crossOriginEmbedderPolicy: false,
    crossOriginOpenerPolicy: { policy: 'same-origin' },
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    dnsPrefetchControl: { allow: true },
    frameguard: { action: 'deny' },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true
    },
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' }
  });
};

const configureCors = () => {
  const allowedOrigins = [env.clientUrl, 'http://localhost:5173', 'http://127.0.0.1:5173'];
  
  return cors({
    origin: (origin, callback) => {
      // Allow mobile app requests, curl, postman or internal requests with undefined origin
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`Origin ${origin} not allowed by CORS gateway policy.`));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Request-Id',
      'X-Requested-With',
      'Accept',
      'Origin'
    ],
    exposedHeaders: ['X-Request-Id']
  });
};

module.exports = {
  helmetGateway: configureHelmet(),
  corsGateway: configureCors()
};
