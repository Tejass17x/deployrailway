const { body, param, query, validationResult } = require('express-validator');

// ─── Utility ─────────────────────────────────────────────────────────────────
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      success: false,
      message: 'Validation failed.',
      error: errors.array(),
    });
  }
  next();
};

// ─── Project Validators ───────────────────────────────────────────────────────
const createProjectRules = [
  body('title').trim().notEmpty().withMessage('Title is required.').isLength({ max: 200 }),
  body('description').trim().notEmpty().withMessage('Description is required.').isLength({ max: 500 }),
  body('status').optional({ values: 'falsy' }).isIn(['draft', 'recruiting', 'active', 'completed', 'archived', 'cancelled']),
  body('visibility').optional({ values: 'falsy' }).isIn(['public', 'private', 'hidden', 'institution-only', 'invitation-only']),
  body('projectType').optional({ values: 'falsy' }).isIn(['open-source', 'private', 'institution-only', 'invitation-only']),
  body('maxTeamMembers').optional({ values: 'falsy' }).isInt({ min: 1, max: 1000 }),
  body('applicationDeadline').optional({ values: 'falsy' }).isISO8601(),
  body('startDate').optional({ values: 'falsy' }).isISO8601(),
  body('endDate').optional({ values: 'falsy' }).isISO8601(),
  body('budget').optional({ values: 'falsy' }).isNumeric({ min: 0 }),
  body('objectives').optional({ values: 'falsy' }).isArray(),
  body('requiredSkills').optional({ values: 'falsy' }).isArray(),
  body('tags').optional({ values: 'falsy' }).isArray(),
  body('keywords').optional({ values: 'falsy' }).isArray(),
  body('researchAreas').optional({ values: 'falsy' }).isArray(),
  body('screeningQuestions').optional({ values: 'falsy' }).isArray(),
];

const updateProjectRules = [
  body('title').optional({ values: 'falsy' }).trim().isLength({ min: 1, max: 200 }),
  body('description').optional({ values: 'falsy' }).trim().isLength({ max: 500 }),
  body('abstract').optional({ values: 'falsy' }).trim().isLength({ max: 1000 }),
  body('longDescription').optional({ values: 'falsy' }).isLength({ max: 20000 }),
  body('maxTeamMembers').optional({ values: 'falsy' }).isInt({ min: 1, max: 1000 }),
  body('applicationDeadline').optional({ values: 'falsy' }).isISO8601(),
  body('visibility').optional({ values: 'falsy' }).isIn(['public', 'private', 'hidden', 'institution-only', 'invitation-only']),
  body('allowApplications').optional({ values: 'falsy' }).isBoolean(),
  body('allowInvitations').optional({ values: 'falsy' }).isBoolean(),
  body('progress').optional({ values: 'falsy' }).isFloat({ min: 0, max: 100 }),
  body('researchDomain').optional({ values: 'falsy' }).trim(),
  body('researchAreas').optional({ values: 'falsy' }).isArray(),
  body('requiredSkills').optional({ values: 'falsy' }).isArray(),
  body('keywords').optional({ values: 'falsy' }).isArray(),
  body('tags').optional({ values: 'falsy' }).isArray(),
  body('projectType').optional({ values: 'falsy' }).isIn(['open-source', 'private', 'institution-only', 'invitation-only']),
  body('startDate').optional({ values: 'falsy' }).isISO8601(),
  body('endDate').optional({ values: 'falsy' }).isISO8601(),
  body('estimatedDuration').optional({ values: 'falsy' }).trim(),
  body('budget').optional({ values: 'falsy' }).isNumeric({ min: 0 }),
  body('currency').optional({ values: 'falsy' }).trim(),
  body('fundingSource').optional({ values: 'falsy' }).trim(),
  body('institution').optional({ values: 'falsy' }).trim(),
  body('department').optional({ values: 'falsy' }).trim(),
  body('screeningQuestions').optional({ values: 'falsy' }).isArray(),
  body('githubUrl').optional({ values: 'falsy' }).trim(),
  body('website').optional({ values: 'falsy' }).trim(),
  body('ethicsApproval').optional({ values: 'falsy' }).isBoolean(),
  body('irbNumber').optional({ values: 'falsy' }).trim(),
  body('objectives').optional({ values: 'falsy' }).isArray(),
  body('expectedOutcomes').optional({ values: 'falsy' }).isArray(),
];

const listProjectsRules = [
  query('page').optional({ values: 'falsy' }).isInt({ min: 1 }),
  query('limit').optional({ values: 'falsy' }).isInt({ min: 1, max: 100 }),
  query('status').optional({ values: 'falsy' }).isIn(['draft', 'recruiting', 'active', 'completed', 'archived', 'cancelled']),
  query('visibility').optional({ values: 'falsy' }).isIn(['public', 'private', 'hidden', 'institution-only', 'invitation-only']),
];

const mongoIdParam = (name = 'id') => [
  param(name).isMongoId().withMessage(`Invalid ${name}.`),
];

module.exports = {
  validate,
  createProjectRules,
  updateProjectRules,
  listProjectsRules,
  mongoIdParam,
};
