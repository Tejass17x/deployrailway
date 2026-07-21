const express = require('express');
const router = express.Router();
const helpController = require('./help.controller');
const { authMiddleware } = require('../../common/middlewares/auth.middleware');
const { authLimiter } = require('../../config/rateLimiter');
const {
  contactValidator,
  grievanceValidator,
  feedbackValidator
} = require('./help.validator');

// Protect all routes under Help Center using authMiddleware
router.post('/contact', authMiddleware, authLimiter, contactValidator, helpController.submitContactRequest);
router.post('/grievance', authMiddleware, authLimiter, grievanceValidator, helpController.submitGrievanceReport);
router.post('/feedback', authMiddleware, authLimiter, feedbackValidator, helpController.submitFeedback);
router.get('/contact-info', authMiddleware, helpController.getContactInformation);

module.exports = router;
