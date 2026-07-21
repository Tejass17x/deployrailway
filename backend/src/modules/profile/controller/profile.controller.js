const profileService = require('../service/profile.service');
const asyncHandler = require('../../../common/middlewares/asyncHandler.middleware');
const scholarService = require('../../scholar/service/scholar.service');
const { ValidationError } = require('../../../common/errors/AppError');
const User = require('../../../models/User');

const emitProfileUpdate = async (req) => {
  try {
    const socketGateway = require('../../../socket/gateway/socket.gateway');
    const userId = req.user._id.toString();
    const user = await User.findById(req.user._id).select('profileImage').lean();
    const profileImage = user?.profileImage?.url || user?.profileImage || '';
    const fullName = `${req.user.firstName} ${req.user.lastName}`;
    const payload = { userId, profileImage, fullName };

    // Emit to self
    socketGateway.emitToUser(userId, 'profile:update', payload);
    socketGateway.emitToUser(userId, 'avatar:update', payload);

    // Find all conversations of this user and notify their contacts
    const Conversation = require('../../messaging/model/Conversation');
    const conversations = await Conversation.find({ participants: req.user._id }).select('participants').lean();
    conversations.forEach(c => {
      const otherId = c.participants.find(p => p.toString() !== userId);
      if (otherId) {
        socketGateway.emitToUser(otherId.toString(), 'profile:update', payload);
        socketGateway.emitToUser(otherId.toString(), 'avatar:update', payload);
      }
    });
  } catch (err) {
    const logger = require('../../../common/logger/winston');
    logger.error(`Failed to emit profile socket updates: ${err.message}`);
  }
};

class ProfileController {
  // Retrieve public profile of a researcher by slug
  getPublicProfile = asyncHandler(async (req, res) => {
    const { profileSlug } = req.params;
    const profile = await profileService.getProfileBySlug(profileSlug, req.user?._id);
    return res.success('Researcher public profile retrieved successfully.', profile);
  });

  // Retrieve own authenticated profile details
  getProfile = asyncHandler(async (req, res) => {
    const profile = await profileService.getProfile(req.user._id);
    return res.success('Researcher profile retrieved successfully.', profile);
  });

  // Update profile details (bulk/flexible payload)
  updateProfile = asyncHandler(async (req, res) => {
    const profile = await profileService.updateProfile(req.user._id, req.body);
    return res.success('Researcher profile updated successfully.', profile);
  });

  // Update cover banner image
  updateBanner = asyncHandler(async (req, res) => {
    let coverImage = req.body.coverImage;
    let uploadDoc = null;
    if (req.file) {
      const uploadService = require('../../upload/service/upload.service');
      uploadDoc = await uploadService.uploadFile({
        file: req.file,
        userId: req.user._id,
        purpose: 'profile-banner'
      });
      coverImage = {
        url: uploadDoc.secure_url,
        objectKey: uploadDoc.public_id,
        mimeType: req.file.mimetype || `image/${uploadDoc.format}`,
        fileSize: uploadDoc.bytes,
        uploadedAt: uploadDoc.uploadedAt || new Date(),
        fileName: req.file.originalname || ''
      };
    }
    
    try {
      const profile = await profileService.updateProfile(req.user._id, { coverImage }, { runBackground: true });
      emitProfileUpdate(req).catch(err => console.error('[Socket] Failed to emit profile updates:', err));
      return res.success('Profile cover banner updated successfully.', profile);
    } catch (err) {
      if (uploadDoc && uploadDoc.public_id) {
        const r2Service = require('../../upload/service/r2.service');
        await r2Service.deleteFile(uploadDoc.public_id, 'image').catch(e => console.error('[Rollback] Banner delete failed:', e));
      }
      throw err;
    }
  });

  // Update profile avatar image
  updateAvatar = asyncHandler(async (req, res) => {
    let profileImage = req.body.profileImage;
    let uploadDoc = null;
    if (req.file) {
      const uploadService = require('../../upload/service/upload.service');
      uploadDoc = await uploadService.uploadFile({
        file: req.file,
        userId: req.user._id,
        purpose: 'profile-avatar'
      });
      profileImage = {
        url: uploadDoc.secure_url,
        thumbnail: uploadDoc.thumbnail || uploadDoc.secure_url,
        etag: uploadDoc.etag || '',
        version: uploadDoc.version || '1',
        objectKey: uploadDoc.public_id,
        mimeType: req.file.mimetype || `image/${uploadDoc.format}`,
        fileSize: uploadDoc.bytes,
        uploadedAt: uploadDoc.uploadedAt || new Date(),
        fileName: req.file.originalname || ''
      };
    }
    
    try {
      const profile = await profileService.updateProfile(req.user._id, { profileImage }, { runBackground: true });
      emitProfileUpdate(req).catch(err => console.error('[Socket] Failed to emit profile updates:', err));
      return res.success('Profile avatar photo updated successfully.', profile);
    } catch (err) {
      if (uploadDoc) {
        const r2Service = require('../../upload/service/r2.service');
        if (uploadDoc.public_id) {
          await r2Service.deleteFile(uploadDoc.public_id, 'image').catch(e => console.error('[Rollback] Avatar delete failed:', e));
        }
        if (uploadDoc.thumbnailKey) {
          await r2Service.deleteFile(uploadDoc.thumbnailKey, 'image').catch(e => console.error('[Rollback] Thumbnail delete failed:', e));
        }
      }
      throw err;
    }
  });

  // Delete profile photo and reset to default
  deletePhoto = asyncHandler(async (req, res) => {
    const uploadService = require('../../upload/service/upload.service');
    await uploadService.deleteProfilePhoto(req.user._id);
    const profile = await profileService.getProfile(req.user._id);
    emitProfileUpdate(req).catch(err => console.error('[Socket] Failed to emit profile updates:', err));
    return res.success('Profile photo removed successfully.', profile);
  });

  // Delete profile banner and reset to default
  deleteBanner = asyncHandler(async (req, res) => {
    const uploadService = require('../../upload/service/upload.service');
    await uploadService.deleteProfileBanner(req.user._id);
    const profile = await profileService.getProfile(req.user._id);
    return res.success('Profile banner removed and reset to default.', profile);
  });

  // Update basic details (First Name, Last Name, Headline, etc.)
  updateBasic = asyncHandler(async (req, res) => {
    const { firstName, lastName, designation, headline, country, state, city, institution, department, displayName } = req.body;
    const profile = await profileService.updateProfile(req.user._id, {
      firstName, lastName, designation, headline, country, state, city, institution, department, displayName
    });
    return res.success('Basic profile details updated successfully.', profile);
  });

  // Update bio biography & research summaries
  updateAbout = asyncHandler(async (req, res) => {
    const { bio, researchSummary, currentResearch, researchVision, availability, openToCollaborate, openToMentor, openToResearch } = req.body;
    const profile = await profileService.updateProfile(req.user._id, {
      bio, researchSummary, currentResearch, researchVision, availability, openToCollaborate, openToMentor, openToResearch
    });
    return res.success('Profile biography details updated successfully.', profile);
  });

  // Update skills list
  updateSkills = asyncHandler(async (req, res) => {
    const { skills } = req.body;
    const profile = await profileService.updateProfile(req.user._id, { skills });
    return res.success('Profile skills list updated successfully.', profile);
  });

  // Update research areas & keywords
  updateResearch = asyncHandler(async (req, res) => {
    const { researchAreas, keywords } = req.body;
    const profile = await profileService.updateProfile(req.user._id, { researchAreas, keywords });
    return res.success('Profile research domains updated successfully.', profile);
  });

  // Update education timeline
  updateEducation = asyncHandler(async (req, res) => {
    const { education } = req.body;
    const profile = await profileService.updateProfile(req.user._id, { education });
    return res.success('Academic history timeline updated successfully.', profile);
  });

  // Update experience timeline
  updateExperience = asyncHandler(async (req, res) => {
    const { experience } = req.body;
    const profile = await profileService.updateProfile(req.user._id, { experience });
    return res.success('Professional work timeline updated successfully.', profile);
  });

  // Update projects list
  updateProjects = asyncHandler(async (req, res) => {
    const { projects } = req.body;
    const profile = await profileService.updateProfile(req.user._id, { projects });
    return res.success('Research projects portfolio updated successfully.', profile);
  });

  // Update social external links
  updateSocial = asyncHandler(async (req, res) => {
    const { socialLinks } = req.body;
    const profile = await profileService.updateProfile(req.user._id, { socialLinks });
    return res.success('Social identities and external links updated successfully.', profile);
  });

  // Retrieve/track profile analytics
  getAnalytics = asyncHandler(async (req, res) => {
    const analytics = await profileService.getAnalytics(req.user._id);
    return res.success('Profile visitor analytics data retrieved successfully.', analytics);
  });

  // Track profile download action
  trackDownload = asyncHandler(async (req, res) => {
    await profileService.logAnalytics(req.user._id, 'downloads');
    return res.success('Profile download event recorded successfully.');
  });

  // Update manual metrics overrides
  updateMetrics = asyncHandler(async (req, res) => {
    const { metrics } = req.body;
    const profile = await profileService.updateProfile(req.user._id, { metrics });
    return res.success('Manual research metrics updated successfully.', profile);
  });

  // Trigger Google Scholar Profile Synchronization
  syncGoogleScholar = asyncHandler(async (req, res) => {
    const job = await scholarService.syncScholar(req.user._id);
    return res.success('Google Scholar sync task enqueued successfully.', job);
  });

  // Handle file uploads (avatar and cover image)
  uploadFile = asyncHandler(async (req, res) => {
    if (!req.file) {
      throw new ValidationError('No file was uploaded.');
    }
    const uploadService = require('../../upload/service/upload.service');
    const purpose = req.body.purpose || req.query.purpose || 'profile-avatar';
    const result = await uploadService.uploadFile({
      file: req.file,
      userId: req.user._id,
      purpose
    });
    return res.success('File uploaded successfully.', {
      url: result.secure_url,
      filename: result.original_filename,
      asset_id: result.asset_id,
      public_id: result.public_id
    });
  });

  // Get public publications list of a researcher profile
  getPublicationsByProfileSlug = asyncHandler(async (req, res) => {
    const { profileSlug } = req.params;
    const { page = 1, limit = 10, sort = '-createdAt', status, visibility, search } = req.query;

    const profile = await profileService.getProfileBySlug(profileSlug, req.user?._id);
    if (!profile) {
      throw new ValidationError('Profile not found.');
    }

    const ownerId = profile.userId;

    // Check if requester is owner
    const isOwner = req.user && req.user._id.toString() === ownerId.toString();
    const isAdmin = req.user && req.user.role === 'admin';

    const filter = { userId: ownerId };
    
    if (isOwner || isAdmin) {
      if (status) filter.status = status;
      if (visibility) filter.visibility = visibility;
      filter.isDeleted = { $ne: true };
    } else {
      // General viewers can only see published, non-deleted, and visible publications
      filter.status = 'published';
      filter.isDeleted = { $ne: true };

      if (req.user) {
        // Logged-in user from same institution can see Public & Institution Only
        if (req.user.institution && req.user.institution === profile.institution) {
          filter.visibility = { $in: ['Public', 'Institution Only'] };
        } else {
          filter.visibility = 'Public';
        }
      } else {
        // Guests can only see Public
        filter.visibility = 'Public';
      }
    }

    // Support search query
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      filter.$or = [
        { title: searchRegex },
        { abstract: searchRegex },
        { keywords: searchRegex },
        { publication: searchRegex }
      ];
    }

    const publicationService = require('../../publication/service/publication.service');
    const publicationDTO = require('../../publication/dto/publication.dto');
    
    const result = await publicationService.getPublications(filter, { page, limit, sort });

    return res.success('Researcher publications retrieved successfully.', {
      docs: publicationDTO.formatPublicationList(result.docs),
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages
    });
  });

  // Soft delete researcher profile and user account
  deleteProfile = asyncHandler(async (req, res) => {
    await profileService.deleteProfile(req.user._id, req.user._id);
    return res.success('Researcher account and profile successfully deleted.');
  });
}

module.exports = new ProfileController();
