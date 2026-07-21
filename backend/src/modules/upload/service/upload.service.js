const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');
const r2Service = require('./r2.service');
const Upload = require('../../../models/Upload');
const Profile = require('../../../models/Profile');
const User = require('../../../models/User');
const Publication = require('../../../models/Publication');
const { ValidationError, NotFoundError } = require('../../../common/errors/AppError');
const logger = require('../../../common/logger/winston');
const { ProfileCache, FeedCache, cacheService } = require('../../../cache/cache.service');
const env = require('../../../config/environment');

const log = logger || console;

// Lazy-load socket to avoid circular dependency
const getSocket = () => {
  try {
    return require('../../../socket');
  } catch {
    return null;
  }
};

const CROCKFORD_BASE32 = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

function encodeBase32(value, length) {
  let result = '';
  for (let i = length - 1; i >= 0; i--) {
    result = CROCKFORD_BASE32[value & 31] + result;
    value = Math.floor(value / 32);
  }
  return result;
}

function generateULID() {
  const now = Date.now();
  const timestampPart = encodeBase32(now, 10);
  const uuid1 = uuidv4().replace(/-/g, '');
  const randomBytes = uuid1.substring(0, 20);
  const randomInt = BigInt('0x' + randomBytes);
  let randomPart = '';
  let remaining = randomInt;
  for (let i = 15; i >= 0; i--) {
    randomPart = CROCKFORD_BASE32[Number(remaining & 31n)] + randomPart;
    remaining = remaining >> 5n;
  }
  return timestampPart + randomPart;
}

/**
 * Generate a unique ID for a resource based on purpose.
 */
const generateIdForPurpose = (purpose) => {
  const ulid = generateULID();
  switch (purpose) {
    case 'publication-pdf':
    case 'publication-cover':
      return `RCPUB_${ulid}`;
    case 'project-image':
      return `RCPROJ_${ulid}`;
    case 'dataset':
      return `RCDATA_${ulid}`;
    case 'institution-logo':
      return `RCINST_${ulid}`;
    case 'patent-document':
      return `RCPAT_${ulid}`;
    case 'thesis':
      return `RCTHESIS_${ulid}`;
    default:
      return `RCMISC_${ulid}`;
  }
};

/**
 * Emit a Socket.IO event to all open sessions of a user, and globally broadcast profile update events.
 * Fires-and-forgets — never throws.
 */
const emitProfileImageUpdate = (userId, eventName, payload) => {
  try {
    const socket = getSocket();
    if (socket) {
      if (socket.emitToUser) {
        socket.emitToUser(String(userId), eventName, payload);
      }
      const io = socket.getIO();
      if (io) {
        io.emit('PROFILE_UPDATED', {
          userId: String(userId),
          ...payload
        });
        log.info(`[UPLOAD SERVICE] Globally broadcasted PROFILE_UPDATED socket event for user ${userId}`);
      }
    }
  } catch (err) {
    log.warn(`[UPLOAD SERVICE] Socket emit failed for ${eventName}: ${err.message}`);
  }
};

/**
 * Invalidate all profile-related cache keys for a user.
 */
const invalidateProfileCache = async (userId) => {
  try {
    await ProfileCache.del(String(userId));
    await FeedCache.flush(); // Flush feed cache so new images appear
    if (cacheService && cacheService.delPattern) {
      await cacheService.delPattern('response:*');
    }
    log.info(`[UPLOAD SERVICE] Cache invalidated for user ${userId}`);
  } catch (err) {
    log.warn(`[UPLOAD SERVICE] Cache invalidation failed for user ${userId}: ${err.message}`);
  }
};

/**
 * Internal upload helper with transaction support flag.
 */
const uploadFileInternal = async ({ file, userId, purpose, resourceId, useTransaction }) => {
  const uploadStart = Date.now();

  if (!file) {
    throw new ValidationError('No file provided for upload.');
  }

  // Ensure purpose is valid
  const allowedPurposes = [
    'profile-avatar', 'profile-banner', 'publication-pdf', 'publication-cover',
    'dataset', 'poster', 'presentation', 'research-image', 'certificate',
    'project-image', 'institution-logo', 'research-document',
    'patent-document', 'book-cover', 'thesis'
  ];

  if (!allowedPurposes.includes(purpose)) {
    throw new ValidationError(`Invalid upload purpose: ${purpose}`);
  }

  // If resourceId is required but not provided, generate one
  let activeResourceId = resourceId || '';
  const requiresResourceId = [
    'publication-pdf', 'publication-cover', 'dataset', 'project-image',
    'institution-logo', 'patent-document', 'thesis'
  ];

  if (!activeResourceId && requiresResourceId.includes(purpose)) {
    activeResourceId = generateIdForPurpose(purpose);
  }

  let session = null;
  if (useTransaction) {
    try {
      session = await mongoose.startSession();
      session.startTransaction();
    } catch (err) {
      log.warn('Failed to start MongoDB session/transaction. Retrying without transaction.', err.message);
      useTransaction = false;
      session = null;
    }
  }

  let uploadedAsset = null;
  let thumbAsset = null;
  let oldAsset = null;

  try {
    const transactionStart = Date.now();

    // 1. Identify if we are replacing an existing asset
    const replacementQuery = { userId, purpose, isDeleted: { $ne: true } };
    if (activeResourceId) {
      replacementQuery.resourceId = activeResourceId;
    }
    const replaceTypes = ['profile-avatar', 'profile-banner', 'publication-pdf', 'publication-cover', 'project-image', 'dataset'];
    if (replaceTypes.includes(purpose)) {
      oldAsset = useTransaction && session
        ? await Upload.findOne(replacementQuery).session(session)
        : await Upload.findOne(replacementQuery);
    }

    const storageStart = Date.now();
    const imageHelper = require('../helper/image.helper');

    // 2. Process image optimizations and upload new asset to R2
    if (purpose === 'profile-avatar') {
      const [compressedAvatarBuffer, thumbnailBuffer] = await Promise.all([
        imageHelper.compressAvatar(file.buffer),
        imageHelper.generateThumbnail(file.buffer)
      ]);

      const [mainAsset, secondaryAsset] = await Promise.all([
        r2Service.uploadFileBuffer(
          compressedAvatarBuffer,
          file.originalname.endsWith('.webp') ? file.originalname : `${file.originalname}.webp`,
          userId,
          purpose,
          activeResourceId,
          'image/webp'
        ),
        r2Service.uploadFileBuffer(
          thumbnailBuffer,
          file.originalname.endsWith('.webp') ? `thumb-${file.originalname}` : `thumb-${file.originalname}.webp`,
          userId,
          purpose,
          activeResourceId,
          'image/webp'
        )
      ]);

      uploadedAsset = mainAsset;
      thumbAsset = secondaryAsset;
    } else if (purpose === 'profile-banner') {
      const compressedBannerBuffer = await imageHelper.compressBanner(file.buffer);
      uploadedAsset = await r2Service.uploadFileBuffer(
        compressedBannerBuffer,
        file.originalname.endsWith('.webp') ? file.originalname : `${file.originalname}.webp`,
        userId,
        purpose,
        activeResourceId,
        'image/webp'
      );
    } else {
      // Standard upload for non-avatar/non-banner files
      uploadedAsset = await r2Service.uploadFileBuffer(
        file.buffer,
        file.originalname,
        userId,
        purpose,
        activeResourceId,
        file.mimetype
      );
    }
    const storageTime = Date.now() - storageStart;

    const mongoStart = Date.now();
    // 3. Save Upload metadata document
    const uploadData = {
      userId,
      purpose,
      resourceId: activeResourceId,
      asset_id: uploadedAsset.asset_id,
      public_id: uploadedAsset.public_id,
      secure_url: uploadedAsset.secure_url,
      resource_type: uploadedAsset.resource_type,
      format: uploadedAsset.format,
      bytes: uploadedAsset.bytes + (thumbAsset ? thumbAsset.bytes : 0),
      width: uploadedAsset.width,
      height: uploadedAsset.height,
      pages: uploadedAsset.pages,
      folder: uploadedAsset.folder,
      version: uploadedAsset.version,
      original_filename: uploadedAsset.original_filename,
      uploadedAt: uploadedAsset.uploadedAt
    };

    let newUploadDoc;
    if (useTransaction && session) {
      const uploadDocs = await Upload.create([uploadData], { session });
      newUploadDoc = uploadDocs[0];
    } else {
      newUploadDoc = await Upload.create(uploadData);
    }

    // 4. Soft delete old upload reference in MongoDB if replacing
    if (oldAsset) {
      const softDeleteData = { isDeleted: true, deletedAt: new Date() };
      if (useTransaction && session) {
        await Upload.findByIdAndUpdate(oldAsset._id, softDeleteData, { session });
      } else {
        await Upload.findByIdAndUpdate(oldAsset._id, softDeleteData);
      }
    }

    // NOTE: Database updates to User/Profile are omitted here. The caller
    // controller/service handles it explicitly via profileService.updateProfile,
    // avoiding the double database save issue.

    // 5. Commit the MongoDB Transaction
    if (useTransaction && session) {
      await session.commitTransaction();
      session.endSession();
    }
    const mongoTime = Date.now() - mongoStart;

    // 6. Post-Commit: delete replaced R2 asset to avoid orphaned files
    if (oldAsset && oldAsset.public_id) {
      await r2Service.deleteFile(oldAsset.public_id, oldAsset.resource_type);
    }

    // 7. Invalidate Redis / in-memory profile cache
    if (['profile-avatar', 'profile-banner'].includes(purpose)) {
      await invalidateProfileCache(userId);
    }

    // 8. Emit Socket.IO real-time update to all user sessions
    if (purpose === 'profile-avatar') {
      const payload = {
        userId: String(userId),
        profileImage: uploadedAsset.secure_url,
        thumbnail: thumbAsset ? thumbAsset.secure_url : uploadedAsset.secure_url,
        etag: uploadedAsset.etag || '',
        version: uploadedAsset.version || '1',
        uploadedAt: uploadedAsset.uploadedAt
      };
      emitProfileImageUpdate(userId, 'profile:imageUpdated', payload);
      emitProfileImageUpdate(userId, 'profileImageUpdated', payload);
    } else if (purpose === 'profile-banner') {
      const payload = {
        userId: String(userId),
        coverImage: uploadedAsset.secure_url,
        uploadedAt: uploadedAsset.uploadedAt
      };
      emitProfileImageUpdate(userId, 'profile:bannerUpdated', payload);
      emitProfileImageUpdate(userId, 'bannerUpdated', payload);
    }

    const totalDuration = Date.now() - uploadStart;
    log.info(`[UPLOAD SERVICE SUCCESS]`, {
      userId,
      purpose,
      resourceId: activeResourceId,
      assetId: newUploadDoc.asset_id,
      bytes: newUploadDoc.bytes,
      storageTimeMs: storageTime,
      mongoTimeMs: mongoTime,
      transactionTimeMs: Date.now() - transactionStart,
      totalDurationMs: totalDuration,
      useTransaction
    });

    const returnObj = newUploadDoc.toObject();
    if (purpose === 'profile-avatar' && thumbAsset) {
      returnObj.thumbnail = thumbAsset.secure_url;
      returnObj.thumbnailKey = thumbAsset.public_id;
      returnObj.etag = uploadedAsset.etag;
      returnObj.version = uploadedAsset.version;
    } else {
      returnObj.etag = uploadedAsset.etag || '';
      returnObj.version = uploadedAsset.version || '1';
    }
    return returnObj;
  } catch (error) {
    // Check if error is due to transaction numbers not allowed (standalone local MongoDB)
    const isTxError = error.message?.includes('Transaction numbers are only allowed') ||
                      error.errmsg?.includes('Transaction numbers are only allowed') ||
                      error.code === 20;

    if (useTransaction && isTxError) {
      log.warn('MongoDB transactions not supported by the database server. Retrying without transaction.');
      if (session) {
        try { await session.abortTransaction(); } catch (e) {}
        session.endSession();
      }
      return uploadFileInternal({ file, userId, purpose, resourceId, useTransaction: false });
    }

    log.error(`[UPLOAD SERVICE FAILED] Aborting upload`, { error: error.message, userId, purpose });

    if (useTransaction && session) {
      try { await session.abortTransaction(); } catch (abortErr) {
        log.error('[UPLOAD SERVICE ABORT FAILED]', abortErr);
      }
      session.endSession();
    }

    // Clean up R2 assets to avoid orphaned files
    if (uploadedAsset && uploadedAsset.public_id) {
      log.info(`[UPLOAD SERVICE ROLLBACK] Deleting newly uploaded R2 asset to avoid orphans`, {
        publicId: uploadedAsset.public_id
      });
      await r2Service.deleteFile(uploadedAsset.public_id, uploadedAsset.resource_type).catch(e => {});
    }
    if (thumbAsset && thumbAsset.public_id) {
      log.info(`[UPLOAD SERVICE ROLLBACK] Deleting newly uploaded R2 thumbnail asset to avoid orphans`, {
        publicId: thumbAsset.public_id
      });
      await r2Service.deleteFile(thumbAsset.public_id, thumbAsset.resource_type).catch(e => {});
    }

    throw error;
  }
};

/**
 * Universal Upload File logic.
 */
const uploadFile = async ({ file, userId, purpose, resourceId }) => {
  return uploadFileInternal({ file, userId, purpose, resourceId, useTransaction: false });
};

/**
 * Internal delete helper with transaction support flag.
 */
const deleteUploadInternal = async (assetId, userId, useTransaction = true) => {
  const upload = await Upload.findOne({ asset_id: assetId, isDeleted: { $ne: true } });
  if (!upload) {
    throw new NotFoundError('Upload not found.');
  }

  // Ensure owner deletes
  if (upload.userId.toString() !== userId.toString()) {
    throw new ValidationError('Unauthorized. You do not own this file.');
  }

  let session = null;
  if (useTransaction) {
    try {
      session = await mongoose.startSession();
      session.startTransaction();
    } catch (err) {
      useTransaction = false;
      session = null;
    }
  }

  try {
    const softDeleteData = { isDeleted: true, deletedAt: new Date() };

    if (useTransaction && session) {
      await Upload.findByIdAndUpdate(upload._id, softDeleteData, { session });
    } else {
      await Upload.findByIdAndUpdate(upload._id, softDeleteData);
    }

    // Remove references from parent resources
    const DEFAULT_BANNER = 'https://iili.io/C7pZ8Ss.jpg';
    if (upload.purpose === 'profile-avatar') {
      if (useTransaction && session) {
        await Profile.findOneAndUpdate({ userId }, { profileImage: { url: '' } }, { session });
        await User.findByIdAndUpdate(userId, { profileImage: { url: '' } }, { session });
      } else {
        await Profile.findOneAndUpdate({ userId }, { profileImage: { url: '' } });
        await User.findByIdAndUpdate(userId, { profileImage: { url: '' } });
      }
    } else if (upload.purpose === 'profile-banner') {
      if (useTransaction && session) {
        await Profile.findOneAndUpdate({ userId }, { coverImage: { url: DEFAULT_BANNER } }, { session });
      } else {
        await Profile.findOneAndUpdate({ userId }, { coverImage: { url: DEFAULT_BANNER } });
      }
    } else if (upload.purpose === 'publication-pdf') {
      const update = { pdfUrl: '', 'document.url': '' };
      if (useTransaction && session) {
        await Publication.findOneAndUpdate({ publicationId: upload.resourceId }, update, { session });
      } else {
        await Publication.findOneAndUpdate({ publicationId: upload.resourceId }, update);
      }
    }

    if (useTransaction && session) {
      await session.commitTransaction();
      session.endSession();
    }

    // Delete from R2
    await r2Service.deleteFile(upload.public_id, upload.resource_type);

    // Invalidate cache
    if (['profile-avatar', 'profile-banner'].includes(upload.purpose)) {
      await invalidateProfileCache(userId);

      // Emit real-time update
      if (upload.purpose === 'profile-avatar') {
        const payload = {
          userId: String(userId),
          profileImage: '',
          uploadedAt: new Date()
        };
        emitProfileImageUpdate(userId, 'profile:imageUpdated', payload);
        emitProfileImageUpdate(userId, 'profileImageUpdated', payload);
      } else {
        const payload = {
          userId: String(userId),
          coverImage: 'https://iili.io/C7pZ8Ss.jpg',
          uploadedAt: new Date()
        };
        emitProfileImageUpdate(userId, 'profile:bannerUpdated', payload);
        emitProfileImageUpdate(userId, 'bannerUpdated', payload);
      }
    }

    return { success: true };
  } catch (error) {
    const isTxError = error.message?.includes('Transaction numbers are only allowed') ||
                      error.errmsg?.includes('Transaction numbers are only allowed') ||
                      error.code === 20;

    if (useTransaction && isTxError) {
      log.warn('MongoDB transactions not supported by the database server on delete. Retrying without transaction.');
      if (session) {
        try { await session.abortTransaction(); } catch (e) {}
        session.endSession();
      }
      return deleteUploadInternal(assetId, userId, false);
    }

    if (useTransaction && session) {
      await session.abortTransaction();
      session.endSession();
    }
    throw error;
  }
};

/**
 * Delete an upload from MongoDB and R2.
 */
const deleteUpload = async (assetId, userId) => {
  return deleteUploadInternal(assetId, userId, false);
};

const deleteProfilePhoto = async (userId) => {
  const upload = await Upload.findOne({ userId, purpose: 'profile-avatar', isDeleted: { $ne: true } });
  if (!upload) {
    // No upload record but still clear the MongoDB field
    await Profile.findOneAndUpdate({ userId }, { profileImage: { url: '' } });
    await User.findByIdAndUpdate(userId, { profileImage: { url: '' } });
    await invalidateProfileCache(userId);
    const payload = { userId: String(userId), profileImage: '' };
    emitProfileImageUpdate(userId, 'profile:imageUpdated', payload);
    emitProfileImageUpdate(userId, 'profileImageUpdated', payload);
    return { success: true, message: 'Profile photo cleared.' };
  }
  return deleteUploadInternal(upload.asset_id, userId, false);
};

/**
 * Delete the profile banner by finding the active banner upload for the user.
 */
const deleteProfileBanner = async (userId) => {
  const DEFAULT_BANNER = 'https://iili.io/C7pZ8Ss.jpg';
  const upload = await Upload.findOne({ userId, purpose: 'profile-banner', isDeleted: { $ne: true } });
  if (!upload) {
    await Profile.findOneAndUpdate({ userId }, { coverImage: { url: DEFAULT_BANNER } });
    await invalidateProfileCache(userId);
    const payload = { userId: String(userId), coverImage: DEFAULT_BANNER };
    emitProfileImageUpdate(userId, 'profile:bannerUpdated', payload);
    emitProfileImageUpdate(userId, 'bannerUpdated', payload);
    return { success: true, message: 'Profile banner reset to default.' };
  }
  return deleteUploadInternal(upload.asset_id, userId, false);
};

module.exports = {
  uploadFile,
  deleteUpload,
  deleteProfilePhoto,
  deleteProfileBanner
};
