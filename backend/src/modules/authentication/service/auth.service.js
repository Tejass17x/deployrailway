const bcrypt = require('bcryptjs');
const { signAccessToken, signRefreshToken, verifyRefreshToken } = require('../../../common/utils/jwtHelper');
const { AppError, ValidationError, UnauthorizedError, ForbiddenError, ConflictError } = require('../../../common/errors/AppError');
const User = require('../../../models/User');
const Profile = require('../../../models/Profile');
const Session = require('../../../models/Session');
const RefreshToken = require('../../../models/RefreshToken');
const SecurityLog = require('../../../models/SecurityLog');
const Settings = require('../../../models/Settings');
const ResearchMetric = require('../../../models/ResearchMetric');
const ProfileCompletion = require('../../../models/ProfileCompletion');
const Notification = require('../../../models/Notification');
const logger = require('../../../common/logger/winston');
const emailHelper = require('../helper/email.helper');

class AuthService {
  // Generate a random 6-digit numeric OTP
  _generateOtp() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  // Create audit logs in database and Winston
  async _logSecurityEvent(userId, email, event, description, clientInfo = {}) {
    try {
      const { ip = 'Unknown', userAgent = '', device = 'Unknown', browser = 'Unknown', os = 'Unknown' } = clientInfo;
      
      await SecurityLog.create({
        userId,
        email,
        event,
        description,
        ip: ip,
        userAgent,
        device,
        browser,
        os
      });

      logger.auth.info(`Security Event [${event}] - User: ${userId || email} - ${description} (IP: ${ip}, Device: ${device})`);
    } catch (err) {
      logger.error('Failed to save security log:', err);
    }
  }

  // Cooldown check: Prevents sending OTPs too frequently (resend after 60s)
  async _checkOtpCooldown(email, purpose) {
    const { cacheService } = require('../../../cache/cache.service');
    const cooldownKey = `otp_cooldown:${email.toLowerCase()}:${purpose}`;
    const exists = await cacheService.get(cooldownKey);
    if (exists) {
      const timeDiff = (Date.now() - exists.createdAt) / 1000;
      if (timeDiff < 60) {
        throw new AppError(`Please wait ${Math.ceil(60 - timeDiff)} seconds before requesting a new code.`, 429, 'COOLDOWN_ERROR');
      }
    }
  }

  // User Registration
  async register(registerData, clientInfo = {}) {
    const {
      firstName,
      lastName,
      email,
      password,
      country,
      phone,
      researcherType,
      acceptTerms,
      acceptPrivacy
    } = registerData;

    // Check if email already registered (excluding pending)
    const existingUser = await User.findOne({ email: email.toLowerCase(), isDeleted: { $ne: true } });
    if (existingUser) {
      if (existingUser.status !== 'pending') {
        throw new ConflictError('Email is already registered');
      }
      // If user exists and is pending, we remove the old pending user record to start fresh
      await User.deleteOne({ _id: existingUser._id });
      await Profile.deleteOne({ userId: existingUser._id });
    }

    // Determine organization type based on researcher type
    let organizationType = 'organization';
    if (researcherType === 'academic') organizationType = 'institution';
    else if (researcherType === 'corporate') organizationType = 'company';
    else if (researcherType === 'medical') organizationType = 'hospital';

    // Hash password
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Save pending user
    const user = await User.create({
      firstName,
      lastName,
      email: email.toLowerCase(),
      password: hashedPassword,
      country,
      phone: phone || '',
      role: 'researcher',
      researcherType,
      organizationType,
      status: 'pending',
      emailVerified: false,
      isActive: false
    });

    // Save workplace / profile fields temporarily in a profile to initialize after verification
    const profileFields = {
      userId: user._id,
      country,
      bio: `Researcher (${researcherType}) at Research Connect`,
      profileCompletion: 15
    };

    if (researcherType === 'academic') {
      profileFields.institution = registerData.institution;
      profileFields.department = registerData.department;
      profileFields.designation = registerData.designation || '';
    } else if (researcherType === 'corporate') {
      profileFields.company = registerData.company;
      profileFields.division = registerData.division;
      profileFields.position = registerData.position;
    } else if (researcherType === 'medical') {
      profileFields.institution = registerData.hospital; // Maps hospital to institution in Schema
      profileFields.department = registerData.department;
      profileFields.designation = registerData.designation;
    } else if (researcherType === 'non_researcher') {
      profileFields.institution = registerData.organization;
      profileFields.designation = registerData.occupation;
      profileFields.bio = `Interests: ${registerData.interest}. ${profileFields.bio}`;
    }

    await Profile.create(profileFields);

    // Generate Registration OTP
    const otpCode = this._generateOtp();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

    const otpSalt = await bcrypt.genSalt(10);
    const hashedOtp = await bcrypt.hash(otpCode, otpSalt);

    const { cacheService } = require('../../../cache/cache.service');
    const otpKey = `otp:${email.toLowerCase()}:registration`;
    await cacheService.set(otpKey, {
      email: email.toLowerCase(),
      otp: hashedOtp,
      purpose: 'registration',
      attempts: 0,
      verified: false
    }, 600); // 10 minutes

    const cooldownKey = `otp_cooldown:${email.toLowerCase()}:registration`;
    await cacheService.set(cooldownKey, { createdAt: Date.now() }, 60);

    // Send verification email
    await emailHelper.sendRegistrationOtp(email.toLowerCase(), otpCode);

    await this._logSecurityEvent(user._id, email, 'REGISTER_PENDING', 'User registration initialized, OTP code sent.', clientInfo);

    return {
      userId: user._id,
      email: user.email,
      message: 'Pending registration created. Please verify email OTP.'
    };
  }

  // Resend Registration OTP
  async sendRegistrationOtp(email, clientInfo = {}) {
    const user = await User.findOne({ email: email.toLowerCase(), status: 'pending', isDeleted: { $ne: true } });
    if (!user) {
      throw new AppError('No pending registration found for this email address.', 404, 'NOT_FOUND');
    }

    await this._checkOtpCooldown(email, 'registration');

    const otpCode = this._generateOtp();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    const salt = await bcrypt.genSalt(10);
    const hashedOtp = await bcrypt.hash(otpCode, salt);

    const { cacheService } = require('../../../cache/cache.service');
    const otpKey = `otp:${email.toLowerCase()}:registration`;
    await cacheService.set(otpKey, {
      email: email.toLowerCase(),
      otp: hashedOtp,
      purpose: 'registration',
      attempts: 0,
      verified: false
    }, 600);

    const cooldownKey = `otp_cooldown:${email.toLowerCase()}:registration`;
    await cacheService.set(cooldownKey, { createdAt: Date.now() }, 60);

    await emailHelper.sendRegistrationOtp(email.toLowerCase(), otpCode);
    await this._logSecurityEvent(user._id, email, 'REGISTER_OTP_RESENT', 'Registration OTP resent.', clientInfo);
    
    return { success: true };
  }

  // Verify Registration OTP & Complete Setup
  async verifyRegistrationOtp(email, otpCode, clientInfo = {}) {
    const user = await User.findOne({ email: email.toLowerCase(), status: 'pending', isDeleted: { $ne: true } });
    if (!user) {
      throw new AppError('No pending registration found for this email.', 404, 'NOT_FOUND');
    }

    const { cacheService } = require('../../../cache/cache.service');
    const otpKey = `otp:${email.toLowerCase()}:registration`;
    const otpRecord = await cacheService.get(otpKey);

    if (!otpRecord || otpRecord.verified) {
      throw new AppError('No active OTP found. Please request a new one.', 400, 'INVALID_OTP');
    }

    // Limit Attempts (5 Max)
    if (otpRecord.attempts >= 5) {
      throw new AppError('Too many failed verification attempts. Please request a new code.', 400, 'TOO_MANY_ATTEMPTS');
    }

    // Code Verification
    const isOtpMatch = await bcrypt.compare(otpCode, otpRecord.otp);
    if (!isOtpMatch) {
      otpRecord.attempts += 1;
      await cacheService.set(otpKey, otpRecord, 600);
      throw new AppError('Invalid verification code. Please try again.', 400, 'INVALID_OTP');
    }

    // Delete OTP from Redis
    await cacheService.del(otpKey);

    // Activate User
    user.status = 'active';
    user.emailVerified = true;
    user.otpVerified = true;
    user.verifiedAt = new Date();
    user.isActive = true;
    await user.save();

    // Initialize Settings, Research Metrics, and Completion
    await Settings.create({ userId: user._id });

    // ── Lookup table upserts (non-blocking, best-effort) ─────────────────────
    try {
      const Country = require('../../../models/Country');
      const Institution = require('../../../models/Institution');
      const { LookupCache } = require('../../../cache/cache.service');

      const profile = await Profile.findOne({ userId: user._id }).lean();

      if (profile?.country) {
        await Country.findOneAndUpdate(
          { name: profile.country },
          { name: profile.country },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );
      }

      if (profile?.institution) {
        await Institution.findOneAndUpdate(
          { name: profile.institution },
          { name: profile.institution, country: profile.country || '' },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );
      }

      // Invalidate lookup cache so next request fetches fresh data
      await LookupCache.invalidate();
    } catch (err) {
      logger.error('Lookup upsert failed during registration: ' + err.message);
    }
    
    // Dynamically load profileService to avoid circular dependency
    try {
      const profileService = require('../../profile/service/profile.service');
      await profileService.calculateAndSaveProfileCompletion(user._id);
      await profileService.calculateAndSaveResearchMetrics(user._id);
    } catch (err) {
      logger.error('Failed to calculate profile completion/metrics on verify registration: ' + err.message);
    }

    // Initialize Welcome Notification conforming to Schema
    await Notification.create({
      recipientId: user._id,
      actorId: user._id,
      type: 'system',
      title: 'Welcome to Research Connect!',
      message: 'Your account is active. Complete your profile to build your research identity.',
      targetType: 'System',
      targetId: user._id,
      targetUrl: '/profile',
      isRead: false
    });

    const profile = await Profile.findOne({ userId: user._id });

    // Generate JWT and Session
    const session = await Session.create({
      userId: user._id,
      browser: clientInfo.browser || 'Unknown',
      device: clientInfo.device || 'Unknown',
      os: clientInfo.os || 'Unknown',
      ip: clientInfo.ip || '',
      location: clientInfo.location || 'Unknown',
      loginTime: new Date(),
      active: true
    });

    await cacheService.set(`session:${session._id}`, session, 2592000); // Cache for 30 days

    const accessToken = signAccessToken({ userId: user._id, role: user.role, sessionId: session._id });
    const refreshTokenValue = signRefreshToken({ userId: user._id, sessionId: session._id });
    const refreshExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

    user.refreshToken = refreshTokenValue;
    user.sessionId = session._id;
    await user.save();

    await RefreshToken.create({
      userId: user._id,
      token: refreshTokenValue,
      device: clientInfo.device || 'Unknown',
      browser: clientInfo.browser || 'Unknown',
      expiresAt: refreshExpiry
    });

    // Send Welcome Email
    await emailHelper.sendWelcomeEmail(user.email, user.firstName);

    await this._logSecurityEvent(user._id, email, 'REGISTER_SUCCESS', 'Registration completed successfully.', clientInfo);

    return { user, profile, accessToken, refreshToken: refreshTokenValue };
  }

  // Login: Step 1 (Credentials Verification & OTP Trigger)
  async login(email, password, clientInfo = {}) {
    const user = await User.findOne({ email: email.toLowerCase(), isDeleted: { $ne: true } }).select('+password');
    
    if (!user) {
      throw new UnauthorizedError('This email is not registered with us. Please sign up to create an account.');
    }

    if (user.isBlocked) {
      throw new ForbiddenError('Your account has been suspended. Please contact support.');
    }

    // Check if password matches
    const isPasswordMatch = await bcrypt.compare(password, user.password);
    if (!isPasswordMatch) {
      user.loginAttempts += 1;
      
      if (user.loginAttempts >= 5) {
        user.isBlocked = true;
        user.status = 'suspended';
        await user.save();
        await this._logSecurityEvent(user._id, email, 'ACCOUNT_BLOCKED', 'Account suspended due to too many failed login attempts.', clientInfo);
        await emailHelper.sendSecurityAlertEmail(user.email, 'Account suspended due to suspicious failed login attempts.', clientInfo);
        throw new ForbiddenError('Your account has been suspended due to too many failed login attempts.');
      }
      
      await user.save();
      await this._logSecurityEvent(user._id, email, 'LOGIN_FAILED', 'Failed password attempt.', clientInfo);
      throw new UnauthorizedError('Incorrect password. Please try again.');
    }

    // Accounts under pending registration are redirected to register verify flow
    if (user.status === 'pending') {
      throw new AppError('Your email address is not verified. Please register again to trigger verification.', 403, 'EMAIL_NOT_VERIFIED');
    }

    // Generate Login OTP
    const otpCode = this._generateOtp();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    const salt = await bcrypt.genSalt(10);
    const hashedOtp = await bcrypt.hash(otpCode, salt);

    const { cacheService } = require('../../../cache/cache.service');
    const otpKey = `otp:${email.toLowerCase()}:login`;
    await cacheService.set(otpKey, {
      email: email.toLowerCase(),
      otp: hashedOtp,
      purpose: 'login',
      attempts: 0,
      verified: false
    }, 600);

    const cooldownKey = `otp_cooldown:${email.toLowerCase()}:login`;
    await cacheService.set(cooldownKey, { createdAt: Date.now() }, 60);

    // Send Email OTP
    logger.info(`[DEV ONLY] Login OTP for ${user.email} is: ${otpCode}`);
    await emailHelper.sendLoginOtp(user.email, otpCode, clientInfo);

    await this._logSecurityEvent(user._id, email, 'LOGIN_OTP_TRIGGERED', 'Credentials valid. Login 2FA OTP sent.', clientInfo);

    return {
      requiresOtp: true,
      email: user.email
    };
  }

  // Resend Login OTP
  async sendLoginOtp(email, clientInfo = {}) {
    const user = await User.findOne({ email: email.toLowerCase(), status: 'active', isDeleted: { $ne: true } });
    if (!user) {
      throw new AppError('User not found.', 404, 'NOT_FOUND');
    }

    await this._checkOtpCooldown(email, 'login');

    const otpCode = this._generateOtp();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    const salt = await bcrypt.genSalt(10);
    const hashedOtp = await bcrypt.hash(otpCode, salt);

    const { cacheService } = require('../../../cache/cache.service');
    const otpKey = `otp:${email.toLowerCase()}:login`;
    await cacheService.set(otpKey, {
      email: email.toLowerCase(),
      otp: hashedOtp,
      purpose: 'login',
      attempts: 0,
      verified: false
    }, 600);

    const cooldownKey = `otp_cooldown:${email.toLowerCase()}:login`;
    await cacheService.set(cooldownKey, { createdAt: Date.now() }, 60);

    await emailHelper.sendLoginOtp(user.email, otpCode, clientInfo);
    await this._logSecurityEvent(user._id, email, 'LOGIN_OTP_RESENT', 'Login OTP resent.', clientInfo);
    
    return { success: true };
  }

  // Verify Login OTP (Step 2)
  async verifyLoginOtp(email, otpCode, rememberMe = false, clientInfo = {}) {
    const user = await User.findOne({ email: email.toLowerCase(), isDeleted: { $ne: true } });
    if (!user) {
      throw new AppError('User not found.', 404, 'NOT_FOUND');
    }

    const { cacheService } = require('../../../cache/cache.service');
    const otpKey = `otp:${email.toLowerCase()}:login`;
    const otpRecord = await cacheService.get(otpKey);

    if (!otpRecord || otpRecord.verified) {
      throw new AppError('No active OTP found. Please request a new one.', 400, 'INVALID_OTP');
    }

    if (otpRecord.attempts >= 5) {
      throw new AppError('Too many failed verification attempts. Please request a new code.', 400, 'TOO_MANY_ATTEMPTS');
    }

    const isOtpMatch = await bcrypt.compare(otpCode, otpRecord.otp);
    if (!isOtpMatch) {
      otpRecord.attempts += 1;
      await cacheService.set(otpKey, otpRecord, 600);
      throw new AppError('Invalid verification code. Please try again.', 400, 'INVALID_OTP');
    }

    await cacheService.del(otpKey);

    // Reset login attempts & Set last login info
    user.loginAttempts = 0;
    user.lastLogin = new Date();
    user.lastLoginIP = clientInfo.ip || '';
    user.lastLoginDevice = clientInfo.device || 'Unknown';
    user.status = 'active';
    user.otpVerified = true;
    user.verifiedAt = new Date();
    await user.save();

    const profile = await Profile.findOne({ userId: user._id });

    // Create session
    const session = await Session.create({
      userId: user._id,
      browser: clientInfo.browser || 'Unknown',
      device: clientInfo.device || 'Unknown',
      os: clientInfo.os || 'Unknown',
      ip: clientInfo.ip || '',
      location: clientInfo.location || 'Unknown',
      loginTime: new Date(),
      rememberMe,
      active: true
    });

    await cacheService.set(`session:${session._id}`, session, 2592000);

    const accessToken = signAccessToken({ userId: user._id, role: user.role, sessionId: session._id });
    const refreshTokenValue = signRefreshToken({ userId: user._id, sessionId: session._id });
    
    // Set token expiration (exactly 30 days)
    const refreshExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    user.refreshToken = refreshTokenValue;
    user.sessionId = session._id;
    await user.save();

    await RefreshToken.create({
      userId: user._id,
      token: refreshTokenValue,
      device: clientInfo.device || 'Unknown',
      browser: clientInfo.browser || 'Unknown',
      expiresAt: refreshExpiry
    });

    await this._logSecurityEvent(user._id, email, 'LOGIN_SUCCESS', 'Successful login verification via OTP.', clientInfo);

    return { user, profile, accessToken, refreshToken: refreshTokenValue };
  }

  // Forgot Password (Trigger OTP)
  async forgotPassword(email, clientInfo = {}) {
    const user = await User.findOne({ email: email.toLowerCase(), isDeleted: { $ne: true } });
    if (!user) {
      // Don't throw error to avoid account enumeration attack, return success message anyway
      logger.info(`Forgot password requested for unregistered email: ${email}`);
      return { success: true, message: 'If this email is registered, a password reset link/OTP has been sent.', emailExists: false };
    }

    await this._checkOtpCooldown(email, 'forgot_password');

    const otpCode = this._generateOtp();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    const salt = await bcrypt.genSalt(10);
    const hashedOtp = await bcrypt.hash(otpCode, salt);

    const { cacheService } = require('../../../cache/cache.service');
    const otpKey = `otp:${email.toLowerCase()}:forgot_password`;
    await cacheService.set(otpKey, {
      email: email.toLowerCase(),
      otp: hashedOtp,
      purpose: 'forgot_password',
      attempts: 0,
      verified: false
    }, 600);

    const cooldownKey = `otp_cooldown:${email.toLowerCase()}:forgot_password`;
    await cacheService.set(cooldownKey, { createdAt: Date.now() }, 60);

    await emailHelper.sendForgotPasswordOtp(user.email, otpCode);
    await this._logSecurityEvent(user._id, email, 'FORGOT_PASSWORD_REQUEST', 'Forgot password request initialized. Reset OTP sent.', clientInfo);

    return { success: true, emailExists: true };
  }

  // Reset Password
  async resetPassword(email, otpCode, newPassword, clientInfo = {}) {
    const user = await User.findOne({ email: email.toLowerCase(), isDeleted: { $ne: true } });
    if (!user) {
      throw new AppError('User not found.', 404, 'NOT_FOUND');
    }

    const { cacheService } = require('../../../cache/cache.service');
    const otpKey = `otp:${email.toLowerCase()}:forgot_password`;
    const otpRecord = await cacheService.get(otpKey);

    if (!otpRecord || otpRecord.verified) {
      throw new AppError('No active OTP found. Please request a new one.', 400, 'INVALID_OTP');
    }

    if (otpRecord.attempts >= 5) {
      throw new AppError('Too many failed verification attempts. Please request a new code.', 400, 'TOO_MANY_ATTEMPTS');
    }

    const isOtpMatch = await bcrypt.compare(otpCode, otpRecord.otp);
    if (!isOtpMatch) {
      otpRecord.attempts += 1;
      await cacheService.set(otpKey, otpRecord, 600);
      throw new AppError('Invalid verification code. Please try again.', 400, 'INVALID_OTP');
    }

    await cacheService.del(otpKey);

    // Hash and update password
    const salt = await bcrypt.genSalt(12);
    user.password = await bcrypt.hash(newPassword, salt);
    user.loginAttempts = 0; // reset attempts
    if (user.status === 'suspended') {
      user.status = 'active';
      user.isBlocked = false;
    }
    await user.save();

    // Revoke all existing sessions and refresh tokens for security
    await RefreshToken.deleteMany({ userId: user._id });
    const activeSessions = await Session.find({ userId: user._id, active: true });
    await Session.updateMany({ userId: user._id, active: true }, { active: false, logoutTime: new Date() });

    // Clear sessions from cache
    for (const s of activeSessions) {
      await cacheService.del(`session:${s._id}`);
    }

    await emailHelper.sendPasswordChangedEmail(user.email);
    await this._logSecurityEvent(user._id, email, 'PASSWORD_RESET_SUCCESS', 'Password successfully reset.', clientInfo);

    return { success: true };
  }

  // Refresh Token Rotation (RTR)
  async refreshAccessToken(oldRefreshTokenVal, clientInfo = {}) {
    if (!oldRefreshTokenVal) {
      throw new UnauthorizedError('Refresh token is required.');
    }

    try {
      const decoded = verifyRefreshToken(oldRefreshTokenVal);

      // Look up token in DB
      const storedToken = await RefreshToken.findOne({ token: oldRefreshTokenVal });
      
      // BREACH DETECTION: Refresh Token Reuse Detection
      if (!storedToken) {
        // Someone has already rotated this token! Revoke everything for security
        await RefreshToken.deleteMany({ userId: decoded.userId });
        const activeSessions = await Session.find({ userId: decoded.userId, active: true });
        await Session.updateMany({ userId: decoded.userId, active: true }, { active: false, logoutTime: new Date() });
        const { cacheService } = require('../../../cache/cache.service');
        for (const s of activeSessions) {
          await cacheService.del(`session:${s._id}`);
        }
        
        await this._logSecurityEvent(
          decoded.userId, 
          null, 
          'BREACH_DETECTION', 
          'Reused refresh token presented. Revoked all tokens for user.', 
          clientInfo
        );
        
        const user = await User.findById(decoded.userId);
        if (user) {
          await emailHelper.sendSecurityAlertEmail(
            user.email, 
            'A suspicious token reuse attempt was detected. All sessions on your account have been closed.',
            clientInfo
          );
        }

        throw new UnauthorizedError('Security warning: Session expired or reused. Please log in again.');
      }

      // Check Expiration
      if (new Date() > storedToken.expiresAt) {
        await storedToken.deleteOne();
        throw new UnauthorizedError('Refresh token expired. Please log in again.');
      }

      // Check User is active
      const user = await User.findById(decoded.userId);
      if (!user || user.status !== 'active' || user.isBlocked) {
        throw new ForbiddenError('User account not active.');
      }

      // Check Session is active
      const { cacheService } = require('../../../cache/cache.service');
      const cacheKey = `session:${decoded.sessionId}`;
      let session = await cacheService.get(cacheKey);

      if (!session) {
        session = await Session.findById(decoded.sessionId);
        if (session) {
          await cacheService.set(cacheKey, session, 2592000);
        }
      }
      if (!session || !session.active) {
        throw new UnauthorizedError('Session is inactive.');
      }

      // Rotate tokens
      const newAccessToken = signAccessToken({ userId: user._id, role: user.role, sessionId: session._id });
      const newRefreshTokenValue = signRefreshToken({ userId: user._id, sessionId: session._id });
      
      // Update RefreshToken in database
      storedToken.token = newRefreshTokenValue;
      storedToken.expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
      storedToken.browser = clientInfo.browser || storedToken.browser;
      storedToken.device = clientInfo.device || storedToken.device;
      await storedToken.save();

      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshTokenValue
      };
    } catch (error) {
      if (error instanceof UnauthorizedError || error instanceof ForbiddenError) {
        throw error;
      }
      throw new UnauthorizedError('Invalid refresh token.');
    }
  }

  // Logout Single Device
  async logout(refreshTokenVal, clientInfo = {}) {
    const storedToken = await RefreshToken.findOne({ token: refreshTokenVal });
    if (!storedToken) {
      return { success: true }; // Already logged out
    }

    const { userId, sessionId } = storedToken;

    // Delete token
    await storedToken.deleteOne();

    // Inactivate Session
    if (sessionId) {
      await Session.findByIdAndUpdate(sessionId, { active: false, logoutTime: new Date() });
      const { cacheService } = require('../../../cache/cache.service');
      await cacheService.del(`session:${sessionId}`);
    }

    await this._logSecurityEvent(userId, null, 'LOGOUT_SUCCESS', 'Logged out from current device.', clientInfo);
    return { success: true };
  }

  // Logout All Devices
  async logoutAll(userId, clientInfo = {}) {
    // Delete all tokens
    await RefreshToken.deleteMany({ userId });

    // Inactivate all sessions
    const activeSessions = await Session.find({ userId, active: true });
    await Session.updateMany({ userId, active: true }, { active: false, logoutTime: new Date() });
    const { cacheService } = require('../../../cache/cache.service');
    for (const s of activeSessions) {
      await cacheService.del(`session:${s._id}`);
    }

    await this._logSecurityEvent(userId, null, 'LOGOUT_ALL_SUCCESS', 'Logged out from all devices.', clientInfo);
    return { success: true };
  }

  // Get current session user & profile
  async getCurrentUser(userId) {
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError('User not found.', 404, 'NOT_FOUND');
    }
    const profile = await Profile.findOne({ userId });
    return { user, profile };
  }

  // Change Password
  async changePassword(userId, currentPassword, newPassword, clientInfo = {}) {
    const user = await User.findById(userId).select('+password');
    if (!user) {
      throw new AppError('User not found.', 404, 'NOT_FOUND');
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      throw new ValidationError('Current password is incorrect.', { currentPassword: 'Current password is incorrect.' });
    }

    const salt = await bcrypt.genSalt(12);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    await this._logSecurityEvent(userId, user.email, 'PASSWORD_CHANGE_SUCCESS', 'Password updated successfully.', clientInfo);
    return { success: true };
  }

  // Deactivate Account
  async deactivate(userId, clientInfo = {}) {
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError('User not found.', 404, 'NOT_FOUND');
    }

    user.status = 'suspended';
    user.isActive = false;
    await user.save();

    await RefreshToken.deleteMany({ userId });
    await Session.updateMany({ userId, active: true }, { active: false, logoutTime: new Date() });

    await this._logSecurityEvent(userId, user.email, 'ACCOUNT_DEACTIVATED', 'User temporarily deactivated their account.', clientInfo);
    return { success: true };
  }
}

module.exports = new AuthService();