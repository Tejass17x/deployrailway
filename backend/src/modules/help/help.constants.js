/**
 * help.constants.js
 * 
 * Defines categories, enums, and static contact info for the Help Center module.
 */

const CONTACT_CATEGORIES = [
  'General Inquiry',
  'Technical Support',
  'Account Issue',
  'Upload Issue',
  'Download Issue',
  'Other'
];

const GRIEVANCE_CATEGORIES = [
  'Broken Download',
  'Upload Failed',
  'Duplicate Paper',
  'Incorrect Metadata',
  'Plagiarism',
  'Copyright / DMCA',
  'Technical Bug',
  'Spam Content',
  'Other'
];

const FEEDBACK_CATEGORIES = [
  'UI / UX',
  'Search',
  'Upload',
  'Download',
  'Performance',
  'Feature Request',
  'General'
];

const CONTACT_INFO = {
  generalSupportEmail: 'support@researchconnect.org',
  technicalSupportEmail: 'tech@researchconnect.org',
  copyrightEmail: 'dmca@researchconnect.org',
  workingHours: 'Monday - Friday, 9:00 AM - 6:00 PM EST',
  expectedResponseTime: 'Within 24-48 business hours',
  importantNotice: 'Please do not submit password reset requests or sensitive login details through the support form. Use the official Forgot Password page instead.'
};

module.exports = {
  CONTACT_CATEGORIES,
  GRIEVANCE_CATEGORIES,
  FEEDBACK_CATEGORIES,
  CONTACT_INFO
};
