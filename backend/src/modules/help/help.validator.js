const { body } = require('express-validator');
const validationMiddleware = require('../../common/middlewares/validation.middleware');
const { CONTACT_CATEGORIES, GRIEVANCE_CATEGORIES, FEEDBACK_CATEGORIES } = require('./help.constants');

const contactValidator = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ max: 100 })
    .withMessage('Name cannot exceed 100 characters'),
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email address'),
  body('category')
    .notEmpty()
    .withMessage('Category is required')
    .isIn(CONTACT_CATEGORIES)
    .withMessage('Invalid category'),
  body('subject')
    .trim()
    .notEmpty()
    .withMessage('Subject is required')
    .isLength({ min: 3, max: 200 })
    .withMessage('Subject must be between 3 and 200 characters'),
  body('message')
    .trim()
    .notEmpty()
    .withMessage('Message is required')
    .isLength({ min: 10, max: 5000 })
    .withMessage('Message must be between 10 and 5000 characters'),
  body('attachment')
    .optional({ nullable: true })
    .isString()
    .withMessage('Attachment must be a string URL'),
  validationMiddleware
];

const grievanceValidator = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ max: 100 })
    .withMessage('Name cannot exceed 100 characters'),
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email address'),
  body('category')
    .notEmpty()
    .withMessage('Category is required')
    .isIn(GRIEVANCE_CATEGORIES)
    .withMessage('Invalid category'),
  body('paperUrl')
    .optional({ checkFalsy: true })
    .isURL()
    .withMessage('Please provide a valid URL for the research paper'),
  body('description')
    .trim()
    .notEmpty()
    .withMessage('Description is required')
    .isLength({ min: 10, max: 5000 })
    .withMessage('Description must be between 10 and 5000 characters'),
  body('attachment')
    .optional({ nullable: true })
    .isString()
    .withMessage('Attachment must be a string URL'),
  validationMiddleware
];

const feedbackValidator = [
  body('name')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 100 })
    .withMessage('Name cannot exceed 100 characters'),
  body('email')
    .optional({ checkFalsy: true })
    .trim()
    .isEmail()
    .withMessage('Please provide a valid email address'),
  body('rating')
    .notEmpty()
    .withMessage('Rating is required')
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be an integer between 1 and 5'),
  body('category')
    .notEmpty()
    .withMessage('Category is required')
    .isIn(FEEDBACK_CATEGORIES)
    .withMessage('Invalid category'),
  body('comment')
    .trim()
    .notEmpty()
    .withMessage('Comment is required')
    .isLength({ min: 3, max: 2000 })
    .withMessage('Comment must be between 3 and 2000 characters'),
  validationMiddleware
];

module.exports = {
  contactValidator,
  grievanceValidator,
  feedbackValidator
};
