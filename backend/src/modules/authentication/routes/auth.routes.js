const express = require('express');
const router = express.Router();
const authController = require('../controller/auth.controller');
const { authMiddleware } = require('../../../common/middlewares/auth.middleware');
const { authLimiter, otpLimiter, verifyOtpLimiter } = require('../../../config/rateLimiter');
const {
  registerValidator,
  sendOtpValidator,
  verifyOtpValidator,
  loginValidator,
  resetPasswordValidator
} = require('../validator/auth.validator');

// Public Routes with Selective Rate Limiting
router.post('/register', authLimiter, registerValidator, authController.register);
router.post('/send-registration-otp', otpLimiter, sendOtpValidator, authController.sendRegistrationOtp);
router.post('/verify-registration-otp', verifyOtpLimiter, verifyOtpValidator, authController.verifyRegistrationOtp);

router.post('/login', authLimiter, loginValidator, authController.login);
router.post('/send-login-otp', otpLimiter, sendOtpValidator, authController.sendLoginOtp);
router.post('/verify-login-otp', verifyOtpLimiter, verifyOtpValidator, authController.verifyLoginOtp);

router.post('/forgot-password', authLimiter, sendOtpValidator, authController.forgotPassword);
router.post('/reset-password', authLimiter, resetPasswordValidator, authController.resetPassword);

router.post('/send-otp', otpLimiter, sendOtpValidator, authController.sendOtp);
router.post('/verify-otp', verifyOtpLimiter, verifyOtpValidator, authController.verifyOtp);
router.post('/resend-otp', otpLimiter, sendOtpValidator, authController.sendOtp);

router.post('/refresh-token', authController.refreshAccessToken);
router.post('/logout', authController.logout);

// Protected Routes (Require Access Token)
const { changePasswordValidator } = require('../validator/auth.validator');
router.post('/change-password', authMiddleware, changePasswordValidator, authController.changePassword);
router.post('/deactivate', authMiddleware, authController.deactivate);

router.post('/logout-all', authMiddleware({ strictSession: true }), authController.logoutAll);
router.get('/me', authMiddleware, authController.getMe);

module.exports = router;
