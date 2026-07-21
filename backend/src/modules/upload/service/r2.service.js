const { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');
const env = require('../../../config/environment');
const logger = require('../../../common/logger/winston');

const log = logger || console;

// Initialize S3 client for Cloudflare R2 only if configuration is provided
let s3Client = null;
const isR2Configured = env.r2 && env.r2.accountId && env.r2.accessKeyId && env.r2.secretAccessKey;

if (isR2Configured) {
  s3Client = new S3Client({
    region: 'auto',
    endpoint: `https://${env.r2.accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: env.r2.accessKeyId,
      secretAccessKey: env.r2.secretAccessKey
    }
  });
  log.info('Cloudflare R2 Client initialized.');
} else {
  log.warn('Cloudflare R2 credentials not fully configured. Using local uploads directory fallback.');
}

const getResourceTypeFromMime = (mimeType) => {
  if (!mimeType) return 'raw';
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  return 'raw';
};

/**
 * Returns the R2 storage folder path based on purpose.
 * Spec folder structure:
 *   research-connect/profiles/{userId}/profile/
 *   research-connect/profiles/{userId}/banner/
 */
const getFolderForPurpose = (purpose, userId, resourceId) => {
  const cleanUserId = String(userId).replace(/[^a-zA-Z0-9]/g, '');
  const cleanResourceId = String(resourceId || '').replace(/[^a-zA-Z0-9_-]/g, '_');

  switch (purpose) {
    case 'profile-avatar':
      return `research-connect/profiles/${cleanUserId}/profile`;
    case 'profile-banner':
      return `research-connect/profiles/${cleanUserId}/banner`;
    case 'publication-pdf':
      return `research-connect/publications/${cleanResourceId}/paper`;
    case 'publication-attachment':
      return `research-connect/publications/${cleanResourceId}/attachments`;
    case 'publication-cover':
      return `research-connect/publications/${cleanResourceId}/cover`;
    case 'project-image':
      return `research-connect/projects/${cleanResourceId}`;
    case 'project-file':
      return `research-connect/projects/${cleanResourceId}/files`;
    case 'dataset':
      return `research-connect/datasets/${cleanResourceId}`;
    case 'certificate':
      return `research-connect/certificates/${cleanUserId}`;
    case 'institution-logo':
      return `research-connect/institutions/${cleanResourceId}`;
    case 'patent-document':
      return `research-connect/patents/${cleanResourceId}`;
    case 'thesis':
      return `research-connect/thesis/${cleanResourceId}`;
    default:
      return `research-connect/misc/${cleanUserId}`;
  }
};

/**
 * Helper to generate public R2 URL or pre-signed S3 URL for access
 */
const getAccessUrl = async (key, purpose) => {
  if (!isR2Configured) {
    const serverUrl = env.serverUrl || 'http://localhost:5000';
    return `${serverUrl}/uploads/${key}`;
  }

  const publicPurposes = ['profile-avatar', 'profile-banner', 'publication-cover', 'project-image', 'institution-logo', 'book-cover'];

  if (publicPurposes.includes(purpose)) {
    if (env.r2.publicUrl) {
      return `${env.r2.publicUrl}/${key}`;
    }
    return `https://${env.r2.bucketName}.${env.r2.accountId}.r2.cloudflarestorage.com/${key}`;
  }

  // Private file: generate a pre-signed URL (valid for 1 hour)
  try {
    const command = new GetObjectCommand({
      Bucket: env.r2.bucketName,
      Key: key
    });
    return await getSignedUrl(s3Client, command, { expiresIn: 3600 });
  } catch (err) {
    log.error(`Failed to generate pre-signed URL for key ${key}: ${err.message}`);
    return '';
  }
};

/**
 * Upload a file buffer to R2 (or local fallback).
 * Uses UUID-based filename to prevent enumeration and collisions.
 */
const uploadFileBuffer = async (fileBuffer, originalName, userId, purpose, resourceId, mimeType) => {
  const uploadStart = Date.now();
  const folder = getFolderForPurpose(purpose, userId, resourceId);
  const resourceType = getResourceTypeFromMime(mimeType);

  // Use UUID for all filenames to prevent collisions and enumeration attacks
  const uuid = uuidv4();
  const extension = originalName ? path.extname(originalName).toLowerCase() : '.bin';
  
  // For profile images, always use purpose-based semantic name
  let filename;
  if (purpose === 'profile-avatar') {
    filename = `profile-${uuid}${extension}`;
  } else if (purpose === 'profile-banner') {
    filename = `banner-${uuid}${extension}`;
  } else {
    const namePrefix = originalName
      ? originalName.substring(0, originalName.lastIndexOf('.')).replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 50)
      : 'file';
    filename = `${namePrefix}-${uuid}${extension}`;
  }

  const key = `${folder}/${filename}`;
  const format = extension ? extension.replace('.', '') : '';
  const assetId = `r2_${uuid.replace(/-/g, '')}`;

  log.info(`[R2 UPLOAD] Starting upload`, {
    key,
    purpose,
    userId,
    fileSizeBytes: fileBuffer.length,
    resourceType,
    originalName
  });

  let etag = '';
  if (isR2Configured) {
    // Upload to Cloudflare R2
    const command = new PutObjectCommand({
      Bucket: env.r2.bucketName,
      Key: key,
      Body: fileBuffer,
      ContentType: mimeType || 'application/octet-stream',
      // Cache-Control for CDN delivery
      CacheControl: resourceType === 'image' ? 'public, max-age=31536000, immutable' : 'private',
      Metadata: {
        userId: String(userId),
        purpose: String(purpose),
        originalName: String(originalName || '').substring(0, 256)
      }
    });

    const s3Result = await s3Client.send(command);
    etag = s3Result.ETag ? s3Result.ETag.replace(/"/g, '') : '';
  } else {
    // Upload to local storage fallback
    const targetDir = path.join(process.cwd(), 'uploads', folder);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
    const filePath = path.join(targetDir, filename);
    fs.writeFileSync(filePath, fileBuffer);
    etag = `local-etag-${Date.now()}`;
  }

  const durationMs = Date.now() - uploadStart;
  const secureUrl = await getAccessUrl(key, purpose);

  log.info(`[R2 UPLOAD SUCCESS]`, {
    key,
    assetId,
    bytes: fileBuffer.length,
    format,
    durationMs,
    etag
  });

  return {
    asset_id: assetId,
    public_id: key, // R2 Key treated as public_id for consistency
    secure_url: secureUrl,
    resource_type: resourceType,
    format,
    bytes: fileBuffer.length,
    width: 0,
    height: 0,
    pages: 0,
    folder,
    version: '1',
    etag,
    original_filename: originalName || '',
    uploadedAt: new Date(),
    uploadDurationMs: durationMs
  };
};

/**
 * Delete a file from R2 (or local fallback).
 */
const deleteFile = async (key, resourceType = 'raw') => {
  if (!key) {
    log.warn('[R2 DELETE] Called with empty key — skipping');
    return { result: 'skipped', reason: 'empty_key' };
  }

  try {
    log.info(`[R2 DELETE] Deleting file`, { key });

    if (isR2Configured) {
      const command = new DeleteObjectCommand({
        Bucket: env.r2.bucketName,
        Key: key
      });
      await s3Client.send(command);
    } else {
      const filePath = path.join(process.cwd(), 'uploads', key);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    log.info(`[R2 DELETE SUCCESS] Key deleted`, { key });
    return { result: 'ok' };
  } catch (error) {
    log.error(`[R2 DELETE FAILED]`, { key, error: error.message });
    return { result: 'error', error: error.message };
  }
};

module.exports = {
  uploadFileBuffer,
  deleteFile,
  getAccessUrl,
  isR2Configured
};
