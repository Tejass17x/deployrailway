const { body } = require('express-validator');
const { validate } = require('./project.validator');

const createTaskRules = [
  body('title').trim().notEmpty().withMessage('Task title is required.').isLength({ max: 300 }),
  body('description').optional().trim().isLength({ max: 5000 }),
  body('status').optional().isIn(['backlog', 'todo', 'in-progress', 'in-review', 'done', 'cancelled']),
  body('priority').optional().isIn(['critical', 'high', 'medium', 'low']),
  body('assignees').optional().isArray(),
  body('dueDate').optional().isISO8601(),
  body('estimatedHours').optional().isNumeric({ min: 0 }),
  body('milestoneId').optional().isMongoId(),
  body('labels').optional().isArray(),
  body('checklist').optional().isArray(),
];

const updateTaskStatusRules = [
  body('status').trim().notEmpty().isIn(['backlog', 'todo', 'in-progress', 'in-review', 'done', 'cancelled']),
];

const reorderTasksRules = [
  body('status').trim().notEmpty().isIn(['backlog', 'todo', 'in-progress', 'in-review', 'done', 'cancelled']),
  body('orderedIds').isArray({ min: 1 }),
  body('orderedIds.*').isMongoId(),
];

const addCommentRules = [
  body('content').trim().notEmpty().withMessage('Comment content is required.').isLength({ max: 2000 }),
];

module.exports = {
  validate,
  createTaskRules,
  updateTaskStatusRules,
  reorderTasksRules,
  addCommentRules,
};
