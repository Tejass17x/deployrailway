const asyncHandler = require('../../common/middlewares/asyncHandler.middleware');
const helpService = require('./help.service');

class HelpController {
  /**
   * Submit Contact Request
   */
  submitContactRequest = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const contactRequest = await helpService.createContactRequest(userId, req.body);
    
    res.status(201).json({
      success: true,
      message: 'Support request submitted successfully',
      data: contactRequest,
      error: null
    });
  });

  /**
   * Submit Grievance Report
   */
  submitGrievanceReport = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const grievance = await helpService.createGrievance(userId, req.body);

    res.status(201).json({
      success: true,
      message: 'Grievance report submitted successfully',
      data: grievance,
      error: null
    });
  });

  /**
   * Submit Feedback
   */
  submitFeedback = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const feedback = await helpService.createFeedback(userId, req.body);

    res.status(201).json({
      success: true,
      message: 'Feedback submitted successfully',
      data: feedback,
      error: null
    });
  });

  /**
   * Retrieve Contact Information
   */
  getContactInformation = asyncHandler(async (req, res) => {
    const contactInfo = await helpService.getContactInfo();

    res.status(200).json({
      success: true,
      message: 'Contact information retrieved successfully',
      data: contactInfo,
      error: null
    });
  });
}

module.exports = new HelpController();
