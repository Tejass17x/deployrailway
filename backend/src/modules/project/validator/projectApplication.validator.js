const { body } = require('express-validator');
const { validate } = require('./project.validator');

const applyApplicationRules = [
  body('message').optional().trim().isLength({ max: 3000 }),
  body('desiredRole').optional().trim().isLength({ max: 100 }),
  body('githubProfile').optional().trim().isURL(),
  body('linkedinProfile').optional().trim().isURL(),
  body('screeningAnswers').optional().isArray(),
  body('screeningAnswers.*.question').optional().trim().notEmpty(),
  body('screeningAnswers.*.answer').optional().trim().isLength({ max: 2000 }),
  body('availability.hoursPerWeek').optional().isInt({ min: 1, max: 168 }),
];

const reviewApplicationRules = [
  body('note').optional().trim().isLength({ max: 1000 }),
  body('role').optional().trim().isLength({ max: 100 }),
];

const scheduleInterviewRules = [
  body('interviewScheduledAt').notEmpty().isISO8601().withMessage('Interview date/time is required.'),
  body('interviewLink').optional().trim().isURL(),
  body('interviewNote').optional().trim().isLength({ max: 500 }),
];

module.exports = {
  validate,
  applyApplicationRules,
  reviewApplicationRules,
  scheduleInterviewRules,
};
