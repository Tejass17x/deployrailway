const authService = require('../service/auth.service');
const authDTO = require('../dto/auth.dto');
const asyncHandler = require('../../../common/middlewares/asyncHandler.middleware');
const env = require('../../../config/environment');
const { getClientInfo } = require('../../../common/utils/userAgent.helper');
const logger = require('../../../common/logger/winston');

// ─── Request Timeout Wrapper ─────────────────────────────────────────────────
// Wraps an async function with a timeout so that if an external service
// (Redis, MongoDB, SMTP, etc.) hangs, the request fails fast with a 500
// instead of hanging indefinitely until the Vercel 10-second timeout.
const withTimeout = async (promise, ms = 8000, operation = 'operation') => {
  return await Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`Request timeout during ${operation}`)), ms)
    )
  ]);
};

// ─── Safe Service Call Helper ────────────────────────────────────────────────
// Wraps a service call with timeout + error handling. If the service hangs
// or throws, it returns a standardized 500 error response.
const safeServiceCall = async (req, res, operation, serviceFn, clientInfo) => {
  try {
    const result = await withTimeout(serviceFn(), 8000, operation);
    return result;
  } catch (error) {
    logger.error(`[${operation} FAILED] ${error.message}`, {
      email: req.body?.email,
      requestId: req.id,
      stack: error.stack
    });

    // If the error is already an AppError (our custom error), re-throw it
    // so the error handler middleware can format it properly
    if (error.statusCode) {
      throw error;
    }

    // For timeout or unknown errors, return a generic 500
    throw new Error(`Service temporarily unavailable. Please try again. (Error: ${error.message})`);
  }
};

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
    const result = await safeServiceCall(
      req, res, 'register',
      () => authService.register(req.body, clientInfo),
      clientInfo
    );
    return res.success('Registration pending. Email OTP has been sent.', result, 201);
  });

  // Resend Registration OTP
  sendRegistrationOtp = asyncHandler(async (req, res) => {
    const clientInfo = getClientInfo(req);
    await safeServiceCall(
      req, res, 'sendRegistrationOtp',
      () => authService.sendRegistrationOtp(req.body.email, clientInfo),
      clientInfo
    );
    return res.success('Registration OTP has been resent successfully.', { email: req.body.email });
  });

  // Verify Registration OTP
  verifyRegistrationOtp = asyncHandler(async (req, res) => {
    const clientInfo = getClientInfo(req);
    const { email, otp } = req.body;
    const { user, profile, accessToken, refreshToken } = await safeServiceCall(
      req, res, 'verifyRegistrationOtp',
      () => authService.verifyRegistrationOtp(email, otp, clientInfo),
      clientInfo
    );

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
    const result = await safeServiceCall(
      req, res, 'login',
      () => authService.login(email, password, clientInfo),
      clientInfo
    );

    return res.success('Credentials verified. OTP sent for verification.', result);
  });

  // Resend Login OTP
  sendLoginOtp = asyncHandler(async (req, res) => {
    const clientInfo = getClientInfo(req);
    await safeServiceCall(
      req, res, 'sendLoginOtp',
      () => authService.sendLoginOtp(req.body.email, clientInfo),
      clientInfo
    );
    return res.success('Login OTP has been resent successfully.', { email: req.body.email });
  });

  // Verify Login OTP (Complete 2FA)
  verifyLoginOtp = asyncHandler(async (req, res) => {
    const clientInfo = getClientInfo(req);
    const { email, otp, rememberMe } = req.body;
    const { user, profile, accessToken, refreshToken } = await safeServiceCall(
      req, res, 'verifyLoginOtp',
      () => authService.verifyLoginOtp(email, otp, rememberMe, clientInfo),
      clientInfo
    );

    setRefreshTokenCookie(res, refreshToken);

    return res.success(
      'Login verified successfully.',
      authDTO.formatAuthResponse(user, profile, accessToken)
    );
  });

  // Forgot Password
  forgotPassword = asyncHandler(async (req, res) => {
    const clientInfo = getClientInfo(req);
    const result = await safeServiceCall(
      req, res, 'forgotPassword',
      () => authService.forgotPassword(req.body.email, clientInfo),
      clientInfo
    );
    return res.success(result.message || 'If registered, password reset OTP has been sent.', { email: req.body.email, emailExists: result.emailExists });
  });

  // Reset Password
  resetPassword = asyncHandler(async (req, res) => {
    const clientInfo = getClientInfo(req);
    const { email, otp, password } = req.body;
    await safeServiceCall(
      req, res, 'resetPassword',
      () => authService.resetPassword(email, otp, password, clientInfo),
      clientInfo
    );
    return res.success('Password reset successfully. You can now log in.');
  });

  // Change Password
  changePassword = asyncHandler(async (req, res) => {
    const clientInfo = getClientInfo(req);
    const { currentPassword, newPassword } = req.body;
    await safeServiceCall(
      req, res, 'changePassword',
      () => authService.changePassword(req.user._id, currentPassword, newPassword, clientInfo),
      clientInfo
    );
    return res.success('Password changed successfully.');
  });

  // Deactivate Account
  deactivate = asyncHandler(async (req, res) => {
    const clientInfo = getClientInfo(req);
    await safeServiceCall(
      req, res, 'deactivate',
      () => authService.deactivate(req.user._id, clientInfo),
      clientInfo
    );
    clearRefreshTokenCookie(res);
    return res.success('Account deactivated successfully.');
  });

  // Refresh Token Rotation
  refreshAccessToken = asyncHandler(async (req, res) => {
    const clientInfo = getClientInfo(req);
    const oldRefreshToken = req.cookies.refreshToken || req.body.refreshToken;
    const { accessToken, refreshToken } = await safeServiceCall(
      req, res, 'refreshAccessToken',
      () => authService.refreshAccessToken(oldRefreshToken, clientInfo),
      clientInfo
    );

    setRefreshTokenCookie(res, refreshToken);

    return res.success('Access token refreshed successfully.', { accessToken });
  });

  // Logout current session
  logout = asyncHandler(async (req, res) => {
    const clientInfo = getClientInfo(req);
    const refreshToken = req.cookies.refreshToken || req.body.refreshToken;
    await safeServiceCall(
      req, res, 'logout',
      () => authService.logout(refreshToken, clientInfo),
      clientInfo
    );

    clearRefreshTokenCookie(res);

    return res.success('Logged out successfully.');
  });

  // Logout all sessions
  logoutAll = asyncHandler(async (req, res) => {
    const clientInfo = getClientInfo(req);
    await safeServiceCall(
      req, res, 'logoutAll',
      () => authService.logoutAll(req.user._id, clientInfo),
      clientInfo
    );

    clearRefreshTokenCookie(res);

    return res.success('Logged out from all devices successfully.');
  });

  // Get current authenticated user profile
  getMe = asyncHandler(async (req, res) => {
    const { user, profile } = await safeServiceCall(
      req, res, 'getMe',
      () => authService.getCurrentUser(req.user._id),
      {}
    );
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
      await safeServiceCall(
        req, res, 'sendRegistrationOtp',
        () => authService.sendRegistrationOtp(email, clientInfo),
        clientInfo
      );
    } else if (purpose === 'forgot_password') {
      await safeServiceCall(
        req, res, 'forgotPassword',
        () => authService.forgotPassword(email, clientInfo),
        clientInfo
      );
    } else {
      await safeServiceCall(
        req, res, 'sendLoginOtp',
        () => authService.sendLoginOtp(email, clientInfo),
        clientInfo
      );
    }
    return res.success(`OTP code sent successfully for ${purpose}.`, { email, purpose });
  });

  // Unified Verify OTP
  verifyOtp = asyncHandler(async (req, res) => {
    const clientInfo = getClientInfo(req);
    const { email, otp, purpose = 'login', rememberMe = false } = req.body;
    let result;
    if (purpose === 'registration') {
      const { user, profile, accessToken, refreshToken } = await safeServiceCall(
        req, res, 'verifyRegistrationOtp',
        () => authService.verifyRegistrationOtp(email, otp, clientInfo),
        clientInfo
      );
      setRefreshTokenCookie(res, refreshToken);
      result = authDTO.formatAuthResponse(user, profile, accessToken);
    } else if (purpose === 'forgot_password') {
      await safeServiceCall(
        req, res, 'resetPassword',
        () => authService.resetPassword(email, otp, req.body.password, clientInfo),
        clientInfo
      );
      return res.success('Password reset successfully. You can now log in.');
    } else {
      const { user, profile, accessToken, refreshToken } = await safeServiceCall(
        req, res, 'verifyLoginOtp',
        () => authService.verifyLoginOtp(email, otp, rememberMe, clientInfo),
        clientInfo
      );
      setRefreshTokenCookie(res, refreshToken);
      result = authDTO.formatAuthResponse(user, profile, accessToken);
    }
    return res.success('OTP verified successfully.', result);
  });
}

module.exports = new AuthController();