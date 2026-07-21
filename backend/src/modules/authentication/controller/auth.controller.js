const authService = require('../service/auth.service');
const authDTO = require('../dto/auth.dto');
const asyncHandler = require('../../../common/middlewares/asyncHandler.middleware');
const env = require('../../../config/environment');
const { getClientInfo } = require('../../../common/utils/userAgent.helper');


// Helper to set cookie for refresh token
const setRefreshTokenCookie = (res, token) => {
  const isProduction = env.nodeEnv === 'production';
  res.cookie('refreshToken', token, {
    httpOnly: true,
    secure: isProduction, // Set to true in production
    sameSite: isProduction ? 'none' : 'lax', // Use 'none' with secure in cross-origin production
    maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
  });
};

const clearRefreshTokenCookie = (res) => {
  const isProduction = env.nodeEnv === 'production';
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax'
  });
};

class AuthController {
  // Register User
  register = asyncHandler(async (req, res) => {
    const clientInfo = getClientInfo(req);
    const result = await authService.register(req.body, clientInfo);
    return res.success('Registration pending. Email OTP has been sent.', result, 201);
  });

  // Resend Registration OTP
  sendRegistrationOtp = asyncHandler(async (req, res) => {
    const clientInfo = getClientInfo(req);
    await authService.sendRegistrationOtp(req.body.email, clientInfo);
    return res.success('Registration OTP has been resent successfully.', { email: req.body.email });
  });

  // Verify Registration OTP
  verifyRegistrationOtp = asyncHandler(async (req, res) => {
    const clientInfo = getClientInfo(req);
    const { email, otp } = req.body;
    const { user, profile, accessToken, refreshToken } = await authService.verifyRegistrationOtp(email, otp, clientInfo);
    
    setRefreshTokenCookie(res, refreshToken);
    
    return res.success(
      'Email verified. Registration completed successfully.', 
      authDTO.formatAuthResponse(user, profile, accessToken)
    );
  });

  // Login (Credentials validation)
  login = asyncHandler(async (req, res) => {
    const clientInfo = getClientInfo(req);
    const { email, password } = req.body;
    const result = await authService.login(email, password, clientInfo);
    
    return res.success('Credentials verified. OTP sent for verification.', result);
  });

  // Resend Login OTP
  sendLoginOtp = asyncHandler(async (req, res) => {
    const clientInfo = getClientInfo(req);
    await authService.sendLoginOtp(req.body.email, clientInfo);
    return res.success('Login OTP has been resent successfully.', { email: req.body.email });
  });

  // Verify Login OTP (Complete 2FA)
  verifyLoginOtp = asyncHandler(async (req, res) => {
    const clientInfo = getClientInfo(req);
    const { email, otp, rememberMe } = req.body;
    const { user, profile, accessToken, refreshToken } = await authService.verifyLoginOtp(email, otp, rememberMe, clientInfo);

    setRefreshTokenCookie(res, refreshToken);

    return res.success(
      'Login verified successfully.', 
      authDTO.formatAuthResponse(user, profile, accessToken)
    );
  });

  // Forgot Password
  forgotPassword = asyncHandler(async (req, res) => {
    const clientInfo = getClientInfo(req);
    const result = await authService.forgotPassword(req.body.email, clientInfo);
    return res.success(result.message || 'If registered, password reset OTP has been sent.', { email: req.body.email, emailExists: result.emailExists });
  });

  // Reset Password
  resetPassword = asyncHandler(async (req, res) => {
    const clientInfo = getClientInfo(req);
    const { email, otp, password } = req.body;
    await authService.resetPassword(email, otp, password, clientInfo);
    return res.success('Password reset successfully. You can now log in.');
  });

  // Change Password
  changePassword = asyncHandler(async (req, res) => {
    const clientInfo = getClientInfo(req);
    const { currentPassword, newPassword } = req.body;
    await authService.changePassword(req.user._id, currentPassword, newPassword, clientInfo);
    return res.success('Password changed successfully.');
  });

  // Deactivate Account
  deactivate = asyncHandler(async (req, res) => {
    const clientInfo = getClientInfo(req);
    await authService.deactivate(req.user._id, clientInfo);
    clearRefreshTokenCookie(res);
    return res.success('Account deactivated successfully.');
  });

  // Refresh Token Rotation
  refreshAccessToken = asyncHandler(async (req, res) => {
    const clientInfo = getClientInfo(req);
    const oldRefreshToken = req.cookies.refreshToken || req.body.refreshToken;
    const { accessToken, refreshToken } = await authService.refreshAccessToken(oldRefreshToken, clientInfo);

    setRefreshTokenCookie(res, refreshToken);

    return res.success('Access token refreshed successfully.', { accessToken });
  });

  // Logout current session
  logout = asyncHandler(async (req, res) => {
    const clientInfo = getClientInfo(req);
    const refreshToken = req.cookies.refreshToken || req.body.refreshToken;
    await authService.logout(refreshToken, clientInfo);

    clearRefreshTokenCookie(res);

    return res.success('Logged out successfully.');
  });

  // Logout all sessions
  logoutAll = asyncHandler(async (req, res) => {
    const clientInfo = getClientInfo(req);
    await authService.logoutAll(req.user._id, clientInfo);

    clearRefreshTokenCookie(res);

    return res.success('Logged out from all devices successfully.');
  });

  // Get current authenticated user profile
  getMe = asyncHandler(async (req, res) => {
    const { user, profile } = await authService.getCurrentUser(req.user._id);
    return res.success('Current user profile retrieved successfully.', {
      user: authDTO.formatUser(user),
      profile: authDTO.formatProfile(profile)
    });
  });

  // Unified Send OTP
  sendOtp = asyncHandler(async (req, res) => {
    const clientInfo = getClientInfo(req);
    const { email, purpose = 'login' } = req.body;
    if (purpose === 'registration') {
      await authService.sendRegistrationOtp(email, clientInfo);
    } else if (purpose === 'forgot_password') {
      await authService.forgotPassword(email, clientInfo);
    } else {
      await authService.sendLoginOtp(email, clientInfo);
    }
    return res.success(`OTP code sent successfully for ${purpose}.`, { email, purpose });
  });

  // Unified Verify OTP
  verifyOtp = asyncHandler(async (req, res) => {
    const clientInfo = getClientInfo(req);
    const { email, otp, purpose = 'login', rememberMe = false } = req.body;
    let result;
    if (purpose === 'registration') {
      const { user, profile, accessToken, refreshToken } = await authService.verifyRegistrationOtp(email, otp, clientInfo);
      setRefreshTokenCookie(res, refreshToken);
      result = authDTO.formatAuthResponse(user, profile, accessToken);
    } else if (purpose === 'forgot_password') {
      await authService.resetPassword(email, otp, req.body.password, clientInfo);
      return res.success('Password reset successfully. You can now log in.');
    } else {
      const { user, profile, accessToken, refreshToken } = await authService.verifyLoginOtp(email, otp, rememberMe, clientInfo);
      setRefreshTokenCookie(res, refreshToken);
      result = authDTO.formatAuthResponse(user, profile, accessToken);
    }
    return res.success('OTP verified successfully.', result);
  });
}

module.exports = new AuthController();